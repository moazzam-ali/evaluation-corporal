import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { query } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import getOpenAI from "@/lib/openai";
import { computeBodyMetrics, deriveInsights } from "@/lib/body-analysis";
import { getBodyVisionPrompt, VISION_ENUMS } from "@/lib/body-prompts";
import {
  getProductIdsForLanguage,
  enrichRecommendations,
  getProductsForMetrics,
  getConditionRecommendations,
} from "@/lib/products";
import { resolveBot } from "@/lib/bots";
import { sendAnalysisToTelegram } from "@/lib/telegram";
import { indexDocumentsInAppSearch, buildElasticDocuments } from "@/lib/elastic";
import { readFile } from "fs/promises";
import { join } from "path";

// Vision + Cloudinary + DB + Telegram (with retries) + Elastic can exceed 60s;
// a killed function mid-flight is how submissions "break" and Telegram messages
// silently go missing. Give the function real headroom (clamped by plan).
export const maxDuration = 300;

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mimeType: m[1], buffer: Buffer.from(m[2], "base64") };
}

// Structured photo read, validated against the fixed vocabularies so a
// creative model answer can never leak an untranslatable value into the UI.
function sanitizeVisionDetails(vision) {
  if (!vision) return null;
  const oneOf = (value, allowed) => (allowed.includes(value) ? value : null);
  const manyOf = (values, allowed, max) =>
    (Array.isArray(values) ? values.filter((v) => allowed.includes(v)) : []).slice(0, max);

  let visualBodyFat = null;
  const low = Number(vision.visual_body_fat?.low);
  const high = Number(vision.visual_body_fat?.high);
  if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high >= low && high < 70) {
    visualBodyFat = { low: Math.round(low), high: Math.round(high) };
  }

  const confidence = Number(vision.read_confidence);

  return {
    visual_body_fat: visualBodyFat,
    fat_distribution: oneOf(vision.fat_distribution, VISION_ENUMS.fat_distribution),
    muscle_tone: oneOf(vision.muscle_tone, VISION_ENUMS.muscle_tone),
    symmetry: oneOf(vision.symmetry, VISION_ENUMS.symmetry),
    posture_flags: manyOf(vision.posture_flags, VISION_ENUMS.posture_flags, 4),
    focus_areas: manyOf(vision.focus_areas, VISION_ENUMS.focus_areas, 3),
    read_confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, Math.round(confidence))) : null,
  };
}

async function safe(fn, label, steps) {
  try {
    const result = await fn();
    steps[label] = { status: "success" };
    return { ok: true, result };
  } catch (error) {
    console.error(`[analyze-body] ${label} failed:`, error.message);
    steps[label] = { status: "failed", error: error.message };
    return { ok: false, error };
  }
}

export async function POST(request) {
  const steps = {};

  try {
    const body = await request.json();
    const {
      formData,
      image,
      language = "en",
      formId,
      chatIDs,
      botIndex,
      accountIDs,
      contactIDs,
    } = body;

    if (!formData) {
      return NextResponse.json({ error: "Missing formData" }, { status: 400 });
    }

    // 1. Deterministic formula metrics — always runs first, can't fail.
    steps.formulas = { status: "pending" };
    const computed = computeBodyMetrics(formData);
    steps.formulas = { status: "success", overall: computed.overallScore };

    // 2. Upload image to Cloudinary (optional, with fallback to inline data URL).
    let imageUrl = null;
    let inlineImage = null;
    if (image) {
      const parsed = dataUrlToBuffer(image);
      if (parsed) {
        inlineImage = image;
        const up = await safe(
          () => uploadToCloudinary(parsed.buffer, `body-${nanoid(8)}.jpg`, { folder: "body-analysis" }),
          "cloudinary",
          steps
        );
        if (up.ok) imageUrl = up.result.url;
        // If Cloudinary fails we still proceed — OpenAI can use the inline data URL.
      } else {
        steps.cloudinary = { status: "skipped", reason: "Image not in data URL format" };
      }
    } else {
      steps.cloudinary = { status: "skipped", reason: "No image provided" };
    }

    // 3. Pull active product IDs so the AI can recommend.
    let productIds = [];
    const productList = await safe(() => getProductIdsForLanguage(language), "products_list", steps);
    if (productList.ok) productIds = productList.result;

    // 4. Vision call (optional — formulas alone are enough).
    let vision = null;
    if (process.env.OPENAI_API_KEY && (imageUrl || inlineImage)) {
      const v = await safe(async () => {
        const openai = getOpenAI();
        const prompt = getBodyVisionPrompt({ language, formData, computed, productIds });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this body photograph against the brief above." },
                { type: "image_url", image_url: { url: imageUrl || inlineImage } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 1600,
        });
        const raw = completion.choices?.[0]?.message?.content;
        if (!raw) throw new Error("Empty OpenAI response");
        return JSON.parse(raw);
      }, "vision", steps);
      if (v.ok) vision = v.result;
    } else if (!process.env.OPENAI_API_KEY) {
      steps.vision = { status: "skipped", reason: "OPENAI_API_KEY not configured" };
    } else {
      steps.vision = { status: "skipped", reason: "No image to analyze" };
    }

    // 5. Build deterministic insights, merge with vision insights if present.
    const formulaInsights = deriveInsights(computed.metrics, computed.summary);
    const insights = vision?.vision_insights?.length
      ? vision.vision_insights.map((vi) => {
          const matching = formulaInsights.find((fi) => fi.category === vi.category);
          return {
            category: vi.category,
            title: vi.title || matching?.title || vi.category,
            points: [...(matching?.points || []), ...(vi.points || [])].slice(0, 5),
          };
        })
      : formulaInsights;

    // Tips as translatable { key, params, text } objects — the client renders
    // them in the current UI language; vision tips come already localized.
    const tips = vision?.vision_tips?.length
      ? vision.vision_tips
      : [
          { key: "tip_water", params: {}, text: "Match daily water intake to your hydration target." },
          { key: "tip_protein", params: {}, text: "Hit your protein target — split evenly across meals." },
          { key: "tip_sleep", params: {}, text: "Aim for 7-9 hours of sleep — recovery shapes composition more than training volume." },
        ];

    // 6. Build recommendations from THREE sources, deduped in priority order:
    //    (a) AI vision picks, (b) products mapped to EVERY selected health
    //    condition, (c) the metric-based engine. No fixed cap — the list
    //    scales with how many problems the user selected.
    const mergedRecs = [];
    const seenRecIds = new Set();
    const pushRec = (rec) => {
      if (!rec?.product_id || seenRecIds.has(rec.product_id)) return;
      seenRecIds.add(rec.product_id);
      mergedRecs.push(rec);
    };
    if (Array.isArray(vision?.recommendations)) {
      for (const r of vision.recommendations) pushRec(r);
    }
    for (const r of getConditionRecommendations(formData.health_conditions)) pushRec(r);
    const metricBased = await safe(
      () => getProductsForMetrics(computed.metrics, language),
      "products_metric_engine",
      steps
    );
    if (metricBased.ok) {
      for (const p of metricBased.result) pushRec({ product_id: p.id });
    }
    const recommendations = mergedRecs.map((r, i) => ({ ...r, priority: r.priority ?? i + 1 }));

    let enrichedProducts = [];
    const enriched = await safe(
      () => enrichRecommendations(recommendations, language),
      "products_enrich",
      steps
    );
    if (enriched.ok) enrichedProducts = enriched.result;

    // 7. Build results object stored to DB.
    const results = {
      overall_score: computed.overallScore,
      body_type: vision?.body_type || "balanced",
      summary: vision?.summary || `Wellness score ${computed.overallScore}/100 based on your biometrics.`,
      metrics: computed.metrics,
      computed_summary: computed.summary,
      insights,
      tips,
      routine_note: vision?.composition_note || null,
      composition_note: vision?.composition_note || null,
      posture_note: vision?.posture_note || null,
      photo_quality_note: vision?.photo_quality_note || null,
      vision_details: sanitizeVisionDetails(vision),
      recommendations,
      enriched_products: enrichedProducts,
      vision_available: !!vision,
    };

    // 8. Persist to analyses table. Gracefully tolerate DB failure.
    const analysisId = formId || nanoid(22);
    const save = await safe(async () => {
      await query(
        `INSERT INTO analyses (id, form_data, results, image_url, language)
         VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           form_data = EXCLUDED.form_data,
           results = EXCLUDED.results,
           image_url = EXCLUDED.image_url,
           language = EXCLUDED.language`,
        [analysisId, JSON.stringify(formData), JSON.stringify(results), imageUrl, language]
      );
      return analysisId;
    }, "database", steps);

    // 9. Coach notification + CRM indexing — mirrors the original skin flow so
    //    the coach receives a Telegram message (with the results link) and the
    //    lead is indexed in App Search. The end user is NOT shown the results
    //    page; the coach reaches out using the link in this message.
    const chatList = Array.isArray(chatIDs) ? chatIDs.filter(Boolean) : [];
    const accountList = Array.isArray(accountIDs) ? accountIDs.filter(Boolean) : [];
    const contactList = Array.isArray(contactIDs) ? contactIDs.filter(Boolean) : [];

    // Load backend translations for the Telegram message templates (en fallback).
    let translations = {};
    const tr = await safe(async () => {
      const p = join(process.cwd(), "public", "backend-locales", language, "translation.json");
      return JSON.parse(await readFile(p, "utf-8"));
    }, "translations", steps);
    if (tr.ok) {
      translations = tr.result;
    } else {
      try {
        const p = join(process.cwd(), "public", "backend-locales", "en", "translation.json");
        translations = JSON.parse(await readFile(p, "utf-8"));
      } catch {}
    }

    // Telegram → coach, with the report link pointing at this analysis id.
    let telegramResult = { answersText: "" };
    if (chatList.length) {
      const tg = await safe(async () => {
        const bot = await resolveBot(botIndex, language);
        if (!bot) throw new Error("No bot configured for this botIndex/language");
        return sendAnalysisToTelegram({
          chatIDs: chatList,
          bot,
          analysisData: { formData, results },
          translations,
          analysisId,
          language,
        });
      }, "telegram", steps);
      if (tg.ok) {
        telegramResult = tg.result;
        // sendAnalysisToTelegram resolves even when every chat failed — surface
        // the real delivery status instead of a blanket "success".
        if (telegramResult.telegramStatus && telegramResult.telegramStatus !== "success") {
          steps.telegram = { status: telegramResult.telegramStatus, failed: telegramResult.failedChats };
        }
      }
    } else {
      steps.telegram = { status: "skipped", reason: "No chat IDs provided" };
    }

    // Elastic / App Search indexing (CRM record per account/contact pair).
    if (accountList.length || contactList.length) {
      await safe(
        () =>
          indexDocumentsInAppSearch(
            buildElasticDocuments({
              formData,
              results,
              accountIDs: accountList,
              contactIDs: contactList,
              language,
              analysisId,
              answersText: telegramResult.answersText || "",
            })
          ),
        "elastic",
        steps
      );
    } else {
      steps.elastic = { status: "skipped", reason: "No account/contact IDs provided" };
    }

    return NextResponse.json({
      id: analysisId,
      persisted: save.ok,
      results,
      imageUrl,
      steps,
    });
  } catch (error) {
    console.error("[analyze-body] unexpected:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected analysis error", steps },
      { status: 500 }
    );
  }
}
