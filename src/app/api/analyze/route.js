import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import getOpenAI from "@/lib/openai";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { query } from "@/lib/db";
import { getPromptForLanguage, METRIC_IDS } from "@/lib/prompts";
import { enrichRecommendations } from "@/lib/products";
import { resolveBot } from "@/lib/bots";
import { sendAnalysisToTelegram } from "@/lib/telegram";
import { indexDocumentsInAppSearch, buildElasticDocuments } from "@/lib/elastic";
import { readFile } from "fs/promises";
import { join } from "path";

const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "it", "tr", "in", "pt"];

// Vercel function config — 60s for Hobby, up to 300s for Pro
export const maxDuration = 60;

// ------------------------------------------------------------------
// 1. Response validation schema
// ------------------------------------------------------------------
const MetricSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
  status: z.enum(["good", "normal", "needs_attention"]),
  insight: z.string().min(1),
});

const RecommendationSchema = z.object({
  product_id: z.string(),
  priority: z.number().min(1).max(8),
  reason: z.string().min(1),
});

const AnalysisResultSchema = z.object({
  overall_score: z.number().min(0).max(100),
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive"]),
  metrics: z.array(MetricSchema).min(1),
  recommendations: z.array(RecommendationSchema).min(1),
  summary: z.string().min(1),
  insights: z.array(z.object({
    category: z.string(),
    title: z.string(),
    points: z.array(z.string()),
  })).optional(),
  detailed_analysis: z.string().optional(),
  tips: z.array(z.string()).optional(),
  routine_note: z.string().optional(),
});

// ------------------------------------------------------------------
// 2. JSON extraction — handles multiple response formats
// ------------------------------------------------------------------
function extractJSON(content) {
  if (!content || typeof content !== "string") return null;

  const cleaned = content.trim();

  // Strategy 1: Direct parse (ideal — response_format: json_object should give us this)
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Strategy 2: Extract from markdown code block
  const codeBlock = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1].trim());
    } catch {}
  }

  // Strategy 3: Find the outermost balanced { } pair
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

// ------------------------------------------------------------------
// 3. Image validation — check magic bytes
// ------------------------------------------------------------------
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty image data" };
  }

  // Max 10MB raw
  if (buffer.length > 10 * 1024 * 1024) {
    return { valid: false, error: "Image exceeds 10MB limit" };
  }

  // Check JPEG magic bytes: FF D8 FF
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // Check PNG magic bytes: 89 50 4E 47
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  // Check WebP: RIFF....WEBP
  const isWebP =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (!isJPEG && !isPNG && !isWebP) {
    return { valid: false, error: "Invalid image format. Please upload a JPEG, PNG, or WebP image." };
  }

  const mime = isJPEG ? "image/jpeg" : isPNG ? "image/png" : "image/webp";
  return { valid: true, mime };
}

// ------------------------------------------------------------------
// 4. Call OpenAI with retry
// ------------------------------------------------------------------
async function callOpenAIWithRetry(imageUrl, formData, lng, { maxRetries = 2 } = {}) {
  const prompt = getPromptForLanguage(lng);
  const openai = getOpenAI();

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[analyze] OpenAI attempt ${attempt}/${maxRetries}`);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this person's facial skin.${formData.birthDate ? ` Date of birth: ${formData.birthDate}.` : ""}${formData.skinType ? ` Self-reported skin type: ${formData.skinType}.` : ""}${formData.skinConcerns?.length ? ` Main concerns: ${formData.skinConcerns.join(", ")}.` : ""} Return the JSON analysis now.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "auto",
                },
              },
            ],
          },
        ],
        max_tokens: 4500,
        temperature: 0.2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "skin_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall_score: { type: "integer" },
                skin_type: { type: "string", enum: ["oily", "dry", "combination", "normal", "sensitive"] },
                metrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      score: { type: "integer" },
                      status: { type: "string", enum: ["good", "normal", "needs_attention"] },
                      insight: { type: "string" },
                    },
                    required: ["id", "score", "status", "insight"],
                    additionalProperties: false,
                  },
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_id: { type: "string" },
                      priority: { type: "integer" },
                      reason: { type: "string" },
                    },
                    required: ["product_id", "priority", "reason"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["strengths", "concerns", "lifestyle", "goals"] },
                      title: { type: "string" },
                      points: { type: "array", items: { type: "string" } },
                    },
                    required: ["category", "title", "points"],
                    additionalProperties: false,
                  },
                },
                tips: {
                  type: "array",
                  items: { type: "string" },
                },
                routine_note: { type: "string" },
              },
              required: ["overall_score", "skin_type", "metrics", "recommendations", "summary", "insights", "tips", "routine_note"],
              additionalProperties: false,
            },
          },
        },
      });

      const choice = completion.choices?.[0];
      const finishReason = choice?.finish_reason;

      // Check for refusal (Structured Outputs provides this field)
      if (choice?.message?.refusal) {
        console.warn(`[analyze] Model refused: ${choice.message.refusal}`);
        return {
          success: false,
          error: "The image could not be analyzed. Please try a different, clearer photo.",
          retryable: false,
        };
      }

      const content = choice?.message?.content;

      console.log(`[analyze] Attempt ${attempt} — finish_reason: ${finishReason}, content length: ${content?.length || 0}`);

      // Check for content policy refusal
      if (finishReason === "content_filter") {
        return {
          success: false,
          error: "The image could not be analyzed due to content policy. Please try a different photo.",
          retryable: false,
        };
      }

      // Check for length cutoff
      if (finishReason === "length") {
        console.warn(`[analyze] Response was truncated (max_tokens hit)`);
        // Still try to parse what we got — might be a complete JSON
      }

      // Empty response
      if (!content) {
        lastError = "AI returned an empty response";
        if (attempt < maxRetries) {
          console.warn(`[analyze] Empty response, retrying...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return { success: false, error: lastError, retryable: true };
      }

      // Parse JSON
      const parsed = extractJSON(content);
      if (!parsed) {
        lastError = "Failed to parse AI response as JSON";
        console.error(`[analyze] Parse failed. Raw (first 300 chars): ${content.substring(0, 300)}`);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return { success: false, error: lastError, retryable: true };
      }

      // Validate shape with Zod
      const validation = AnalysisResultSchema.safeParse(parsed);
      if (!validation.success) {
        const issues = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        console.error(`[analyze] Validation failed: ${issues}`);

        // Try to fix common issues before rejecting
        const fixed = attemptFix(parsed);
        const revalidation = AnalysisResultSchema.safeParse(fixed);
        if (revalidation.success) {
          console.log(`[analyze] Auto-fixed validation issues`);
          return { success: true, results: revalidation.data };
        }

        lastError = "AI response did not match expected format";
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return { success: false, error: lastError, retryable: true };
      }

      return { success: true, results: validation.data };
    } catch (err) {
      lastError = err.message;
      console.error(`[analyze] Attempt ${attempt} error: ${err.message}`);

      // Don't retry on auth errors or invalid requests
      if (err.status === 401 || err.status === 403) {
        return { success: false, error: "API authentication error. Please check configuration.", retryable: false };
      }
      if (err.status === 400) {
        return { success: false, error: "Invalid request to AI service. The image may be corrupted.", retryable: false };
      }

      // Retry on 429 (rate limit), 500, 502, 503
      if (attempt < maxRetries) {
        const delay = attempt * 3000;
        console.warn(`[analyze] Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }

  return { success: false, error: lastError || "Analysis failed after retries", retryable: false };
}

// ------------------------------------------------------------------
// 5. Attempt to fix common AI response issues
// ------------------------------------------------------------------
function attemptFix(parsed) {
  const fixed = { ...parsed };

  // Fix: overall_score might be a string
  if (typeof fixed.overall_score === "string") {
    fixed.overall_score = parseInt(fixed.overall_score, 10);
  }

  // Fix: metrics might have string scores
  if (Array.isArray(fixed.metrics)) {
    fixed.metrics = fixed.metrics.map((m) => ({
      ...m,
      score: typeof m.score === "string" ? parseInt(m.score, 10) : m.score,
      // Fix: status might be missing — derive from score
      status: m.status || (m.score >= 80 ? "good" : m.score >= 40 ? "normal" : "needs_attention"),
    }));

    // Fix: metrics might be missing some — pad with defaults
    const existingIds = new Set(fixed.metrics.map((m) => m.id));
    for (const id of METRIC_IDS) {
      if (!existingIds.has(id)) {
        fixed.metrics.push({
          id,
          score: 50,
          status: "normal",
          insight: "Could not be assessed from the provided photo.",
        });
      }
    }
  }

  // Fix: recommendations might have string priorities
  if (Array.isArray(fixed.recommendations)) {
    fixed.recommendations = fixed.recommendations.map((r) => ({
      ...r,
      priority: typeof r.priority === "string" ? parseInt(r.priority, 10) : r.priority,
    }));
  }

  // Fix: skin_type might have different casing
  if (typeof fixed.skin_type === "string") {
    fixed.skin_type = fixed.skin_type.toLowerCase();
  }

  return fixed;
}

// ------------------------------------------------------------------
// 6. Main handler
// ------------------------------------------------------------------
export async function POST(request) {
  const startTime = Date.now();

  // Step tracker — each step records its own status
  const steps = {
    cloudinary:   { status: "pending", error: null },
    ai_analysis:  { status: "pending", error: null },
    products:     { status: "pending", error: null },
    database:     { status: "pending", error: null },
    translations: { status: "pending", error: null },
    telegram:     { status: "pending", error: null },
    elasticsearch:{ status: "pending", error: null },
  };

  try {
    // ── Parse & validate request (blocking — no point continuing if bad) ──
    let formDataReq;
    try {
      formDataReq = await request.formData();
    } catch (err) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const image = formDataReq.get("image");
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    let formData;
    try {
      formData = JSON.parse(formDataReq.get("formData") || "{}");
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    let chatIDs, accountIDs, contactIDs;
    try {
      chatIDs = JSON.parse(formDataReq.get("chatIDs") || "[]");
      accountIDs = JSON.parse(formDataReq.get("accountIDs") || "[]");
      contactIDs = JSON.parse(formDataReq.get("contactIDs") || "[]");
    } catch {
      chatIDs = [];
      accountIDs = [];
      contactIDs = [];
    }

    const botIndex = formDataReq.get("botIndex") || "1";
    const lng = SUPPORTED_LANGUAGES.includes(formDataReq.get("lng")) ? formDataReq.get("lng") : "en";

    const id = nanoid(22);

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageValidation = validateImageBuffer(imageBuffer);
    if (!imageValidation.valid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    console.log(`[analyze] ID: ${id}, image: ${imageBuffer.length} bytes (${imageValidation.mime}), lang: ${lng}`);

    // ── Step 1: Upload to Cloudinary ──
    let imageUrl;
    try {
      const cloudResult = await uploadToCloudinary(imageBuffer, `skin-${id}.jpg`);
      imageUrl = cloudResult.url;
      steps.cloudinary.status = "success";
      steps.cloudinary.url = imageUrl;
      console.log(`[analyze] Step 1/7 Cloudinary OK: ${imageUrl}`);
    } catch (err) {
      steps.cloudinary.status = "failed";
      steps.cloudinary.error = err.message;
      // Fallback to base64 so analysis can still proceed
      imageUrl = `data:${imageValidation.mime};base64,${imageBuffer.toString("base64")}`;
      console.warn(`[analyze] Step 1/7 Cloudinary failed (using base64 fallback): ${err.message}`);
    }

    // ── Step 2: AI Analysis (blocking — the core of the flow) ──
    const aiResult = await callOpenAIWithRetry(imageUrl, formData, lng);

    if (!aiResult.success) {
      steps.ai_analysis.status = "failed";
      steps.ai_analysis.error = aiResult.error;
      console.error(`[analyze] Step 2/7 AI analysis failed: ${aiResult.error}`);
      const status = aiResult.retryable ? 502 : 400;
      return NextResponse.json({
        error: aiResult.error,
        steps,
        duration: Date.now() - startTime,
      }, { status });
    }

    const { results } = aiResult;
    steps.ai_analysis.status = "success";
    steps.ai_analysis.score = results.overall_score;
    console.log(`[analyze] Step 2/7 AI OK in ${Date.now() - startTime}ms — score: ${results.overall_score}`);

    // ── Step 3: Enrich product recommendations ──
    try {
      const enriched = await enrichRecommendations(results.recommendations, lng);
      results.enriched_products = enriched;
      steps.products.status = "success";
      steps.products.count = enriched.length;
      console.log(`[analyze] Step 3/7 Products OK: ${enriched.length} enriched`);
    } catch (err) {
      steps.products.status = "failed";
      steps.products.error = err.message;
      results.enriched_products = [];
      console.warn(`[analyze] Step 3/7 Products failed: ${err.message}`);
    }

    // ── Step 4: Save to PostgreSQL ──
    if (!process.env.DATABASE_URL) {
      steps.database.status = "skipped";
      steps.database.error = "DATABASE_URL not configured";
      console.warn(`[analyze] Step 4/7 Database skipped: no DATABASE_URL`);
    } else {
      try {
        await query(
          "INSERT INTO analyses (id, form_data, results, image_url, language, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
          [id, JSON.stringify(formData), JSON.stringify(results), imageUrl.startsWith("data:") ? null : imageUrl, lng]
        );
        steps.database.status = "success";
        console.log(`[analyze] Step 4/7 Database OK: ${id}`);
      } catch (err) {
        steps.database.status = "failed";
        steps.database.error = err.message;
        console.error(`[analyze] Step 4/7 Database failed: ${err.message}`);
      }
    }

    // ── Step 5: Load backend translations ──
    let translations = {};
    try {
      const translationsPath = join(process.cwd(), "public", "backend-locales", lng, "translation.json");
      const file = await readFile(translationsPath, "utf-8");
      translations = JSON.parse(file);
      steps.translations.status = "success";
      console.log(`[analyze] Step 5/7 Translations OK: ${lng}`);
    } catch (err) {
      steps.translations.status = "failed";
      steps.translations.error = err.message;
      console.warn(`[analyze] Step 5/7 Translations failed for ${lng}: ${err.message}`);
    }

    // ── Step 6: Send to Telegram ──
    let telegramResult = { telegramStatus: "skipped", results: [], failedChats: [], answersText: "" };
    if (chatIDs.length === 0) {
      steps.telegram.status = "skipped";
      steps.telegram.error = "No chat IDs provided";
    } else {
      try {
        const bot = await resolveBot(botIndex ? parseInt(botIndex) : null, lng);
        if (!bot) {
          steps.telegram.status = "failed";
          steps.telegram.error = `No bot found for botIndex=${botIndex} or language=${lng}`;
          console.warn(`[analyze] Step 6/7 Telegram: ${steps.telegram.error}`);
        } else {
          telegramResult = await sendAnalysisToTelegram({
            chatIDs,
            bot,
            analysisData: { formData, results },
            translations,
            analysisId: id,
            language: lng,
          });

          if (telegramResult.failedChats.length === 0) {
            steps.telegram.status = "success";
            steps.telegram.sentTo = chatIDs.length;
          } else if (telegramResult.failedChats.length < chatIDs.length) {
            steps.telegram.status = "partial";
            steps.telegram.sentTo = chatIDs.length - telegramResult.failedChats.length;
            steps.telegram.failedChats = telegramResult.failedChats;
          } else {
            steps.telegram.status = "failed";
            steps.telegram.failedChats = telegramResult.failedChats;
          }
          console.log(`[analyze] Step 6/7 Telegram ${steps.telegram.status}: ${chatIDs.length} chats, ${telegramResult.failedChats.length} failed`);
        }
      } catch (err) {
        steps.telegram.status = "failed";
        steps.telegram.error = err.message;
        console.error(`[analyze] Step 6/7 Telegram failed: ${err.message}`);
      }
    }

    // ── Step 7: Index in Elasticsearch App Search ──
    let elasticDocIds = [];
    if (accountIDs.length === 0 && contactIDs.length === 0) {
      steps.elasticsearch.status = "skipped";
      steps.elasticsearch.error = "No account/contact IDs provided";
    } else {
      try {
        const documents = buildElasticDocuments({
          formData,
          results,
          accountIDs,
          contactIDs,
          language: lng,
          analysisId: id,
          answersText: telegramResult.answersText || "",
        });

        if (documents.length > 0) {
          const ecResult = await indexDocumentsInAppSearch(documents);
          elasticDocIds = ecResult.map((r) => r.id || null);
          steps.elasticsearch.status = "success";
          steps.elasticsearch.indexed = elasticDocIds.length;
          console.log(`[analyze] Step 7/7 Elasticsearch OK: ${elasticDocIds.length} docs`);
        } else {
          steps.elasticsearch.status = "skipped";
          steps.elasticsearch.error = "No documents to index";
        }
      } catch (err) {
        steps.elasticsearch.status = "failed";
        steps.elasticsearch.error = err.message;
        console.error(`[analyze] Step 7/7 Elasticsearch failed: ${err.message}`);
      }
    }

    // ── Build response with full step report ──
    const failedSteps = Object.entries(steps).filter(([, s]) => s.status === "failed");
    const succeededSteps = Object.entries(steps).filter(([, s]) => s.status === "success");
    const skippedSteps = Object.entries(steps).filter(([, s]) => s.status === "skipped");

    let overallStatus;
    if (failedSteps.length === 0) {
      overallStatus = "success";
    } else if (succeededSteps.length > 0) {
      overallStatus = "partial_success";
    } else {
      overallStatus = "failed";
    }

    const duration = Date.now() - startTime;
    console.log(`[analyze] Done in ${duration}ms — ${overallStatus}: ${succeededSteps.length} ok, ${failedSteps.length} failed, ${skippedSteps.length} skipped`);

    return NextResponse.json({
      id,
      status: overallStatus,
      results,
      steps,
      elasticDocIds,
      duration,
      message: failedSteps.length > 0
        ? `Analysis complete. Failed: ${failedSteps.map(([k]) => k).join(", ")}`
        : "Analysis complete — all steps succeeded",
    });
  } catch (error) {
    console.error(`[analyze] Fatal: ${error.message}`, error.stack);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        steps,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
