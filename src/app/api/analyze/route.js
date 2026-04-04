import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import getOpenAI from "@/lib/openai";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { query } from "@/lib/db";
import { getPromptForLanguage, METRIC_IDS } from "@/lib/prompts";
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
  priority: z.number().min(1).max(10),
  reason: z.string().min(1),
});

const AnalysisResultSchema = z.object({
  overall_score: z.number().min(0).max(100),
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive"]),
  metrics: z.array(MetricSchema).min(1),
  recommendations: z.array(RecommendationSchema).min(1),
  summary: z.string().min(1),
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
        max_tokens: 3000,
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
              },
              required: ["overall_score", "skin_type", "metrics", "recommendations", "summary"],
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
      status: m.status || (m.score >= 70 ? "good" : m.score >= 40 ? "normal" : "needs_attention"),
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

  try {
    // Parse form data
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

    // Generate unique ID
    const id = nanoid(22);

    // Validate image
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageValidation = validateImageBuffer(imageBuffer);
    if (!imageValidation.valid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    console.log(`[analyze] ID: ${id}, image: ${imageBuffer.length} bytes (${imageValidation.mime}), lang: ${lng}`);

    // Upload to Cloudinary or fallback to base64
    let imageUrl;
    try {
      const cloudResult = await uploadToCloudinary(imageBuffer, `skin-${id}.jpg`);
      imageUrl = cloudResult.url;
      console.log(`[analyze] Cloudinary upload OK: ${imageUrl}`);
    } catch (err) {
      console.warn(`[analyze] Cloudinary skipped: ${err.message}`);
      imageUrl = `data:${imageValidation.mime};base64,${imageBuffer.toString("base64")}`;
    }

    // Call OpenAI with retry
    const aiResult = await callOpenAIWithRetry(imageUrl, formData, lng);

    if (!aiResult.success) {
      const status = aiResult.retryable ? 502 : 400;
      return NextResponse.json({ error: aiResult.error }, { status });
    }

    const { results } = aiResult;
    console.log(`[analyze] Success in ${Date.now() - startTime}ms. Score: ${results.overall_score}, metrics: ${results.metrics.length}`);

    // ------ Step 4: Store in PostgreSQL ------
    if (process.env.DATABASE_URL) {
      try {
        await query(
          "INSERT INTO analyses (id, form_data, results, image_url, language, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
          [id, JSON.stringify(formData), JSON.stringify(results), imageUrl.startsWith("data:") ? null : imageUrl, lng]
        );
        console.log(`[analyze] Stored in DB: ${id}`);
      } catch (dbErr) {
        console.error(`[analyze] DB insert failed: ${dbErr.message}`);
      }
    }

    // ------ Step 5: Load backend translations ------
    let translations = {};
    try {
      const translationsPath = join(process.cwd(), "public", "backend-locales", lng, "translation.json");
      const file = await readFile(translationsPath, "utf-8");
      translations = JSON.parse(file);
    } catch (err) {
      console.warn(`[analyze] Backend translations not loaded for ${lng}: ${err.message}`);
    }

    // ------ Step 6: Send to Telegram (same pattern as nutritional project) ------
    let telegramResult = { telegramStatus: "skipped", results: [], failedChats: [], answersText: "" };
    if (chatIDs.length > 0) {
      try {
        telegramResult = await sendAnalysisToTelegram({
          chatIDs,
          botIndex: parseInt(botIndex),
          analysisData: { formData, results },
          translations,
          analysisId: id,
          language: lng,
        });
      } catch (err) {
        console.error(`[analyze] Telegram failed: ${err.message}`);
        telegramResult.telegramStatus = "failed";
      }
    }

    // ------ Step 7: Index in Elasticsearch App Search ------
    let elasticDocIds = [];
    if (accountIDs.length > 0 || contactIDs.length > 0) {
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
          console.log(`[analyze] Indexing ${documents.length} documents in Elastic`);
          const ecResult = await indexDocumentsInAppSearch(documents);
          elasticDocIds = ecResult.map((r) => r.id || null);
        }
      } catch (err) {
        console.error(`[analyze] Elasticsearch indexing failed: ${err.message}`);
      }
    }

    // ------ Build response (same structure as nutritional project) ------
    const responseData = {
      id,
      elasticDocIds,
      status: "success",
      results,
      telegramStatus: telegramResult.telegramStatus,
    };

    if (telegramResult.failedChats.length > 0) {
      responseData.status = telegramResult.telegramStatus === "failed" ? "partial_success" : "partial_success";
      responseData.failedChats = telegramResult.failedChats;
      responseData.message = "Analysis complete, but some Telegram notifications failed";
    } else {
      responseData.message = "Analysis complete and all notifications sent";
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[analyze] Fatal: ${error.message}`, error.stack);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
