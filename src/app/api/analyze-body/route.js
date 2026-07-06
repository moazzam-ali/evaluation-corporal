import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { query } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import getOpenAI from "@/lib/openai";
import { computeBodyMetrics, deriveInsights } from "@/lib/body-analysis";
import { PHOTO_COACH_SYSTEM, getPhotoAnalysisUserText } from "@/lib/body-prompts";
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

// Tolerant cleanup of the coach-prompt JSON. Free-text fields are stored as
// returned (already in the report language); the body-fat range string is
// additionally parsed into numbers so the UI can compare it against the
// formula estimate.
function sanitizePhotoAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;
  const str = (v, max = 800) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const strArr = (v, max) =>
    (Array.isArray(v) ? v : [])
      .filter((x) => typeof x === "string" && x.trim())
      .map((x) => x.trim().slice(0, 140))
      .slice(0, max);

  const analysis = str(raw.analysis);
  if (!analysis) return null;

  // "~18-22 % (orientativo)" → { low: 18, high: 22 }; single figures get ±2.
  const bodyFatText = str(raw.body_fat, 80);
  let visualBodyFat = null;
  if (bodyFatText) {
    const range = bodyFatText.match(/(\d+(?:[.,]\d+)?)\s*[-–a]\s*(\d+(?:[.,]\d+)?)/);
    const single = bodyFatText.match(/(\d+(?:[.,]\d+)?)/);
    const num = (s) => Number(String(s).replace(",", "."));
    if (range) {
      const low = num(range[1]);
      const high = num(range[2]);
      if (low > 0 && high >= low && high < 70) visualBodyFat = { low: Math.round(low), high: Math.round(high) };
    } else if (single) {
      const mid = num(single[1]);
      if (mid > 2 && mid < 68) visualBodyFat = { low: Math.round(mid - 2), high: Math.round(mid + 2) };
    }
  }

  return {
    analysis,
    highlights: strArr(raw.highlights, 4),
    improve: strArr(raw.improve, 4),
    progress: str(raw.progress),
    visual_age: str(raw.visual_age, 40),
    visual_age_note: str(raw.visual_age_note, 200),
    wellness: str(raw.wellness, 400),
    muscle_tone: str(raw.muscle_tone, 120),
    posture: str(raw.posture, 120),
    fitness_level: str(raw.fitness_level, 120),
    body_fat: bodyFatText,
    visual_body_fat: visualBodyFat,
    is_progress_photo: raw.is_progress_photo !== false,
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

    // 4. Photo analysis (optional — formulas alone are enough).
    //    Coach-voice prompt, gpt-4.1-mini, low-detail image, JSON mode.
    //    One retry on failure/unparseable/empty analysis before giving up.
    let photoAnalysis = null;
    if (process.env.OPENAI_API_KEY && (inlineImage || imageUrl)) {
      const callPhotoAnalysis = async () => {
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create(
          {
            model: "gpt-4.1-mini",
            temperature: 0.5,
            max_tokens: 600,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: PHOTO_COACH_SYSTEM },
              {
                role: "user",
                content: [
                  { type: "text", text: getPhotoAnalysisUserText({ language, formData, computed }) },
                  // Base64 data-URI preferred; detail:"low" per spec (cost/speed).
                  { type: "image_url", image_url: { url: inlineImage || imageUrl, detail: "low" } },
                ],
              },
            ],
          },
          { timeout: 60_000 }
        );
        const raw = completion.choices?.[0]?.message?.content;
        if (!raw) throw new Error("Empty OpenAI response");
        const cleaned = sanitizePhotoAnalysis(JSON.parse(raw));
        if (!cleaned) throw new Error("Empty analysis in photo read");
        return cleaned;
      };
      const v = await safe(async () => {
        try {
          return await callPhotoAnalysis();
        } catch (err) {
          console.error("[analyze-body] photo analysis attempt 1 failed:", err.message);
          return await callPhotoAnalysis();
        }
      }, "vision", steps);
      if (v.ok) photoAnalysis = v.result;
    } else if (!process.env.OPENAI_API_KEY) {
      steps.vision = { status: "skipped", reason: "OPENAI_API_KEY not configured" };
    } else {
      steps.vision = { status: "skipped", reason: "No image to analyze" };
    }

    // 5. Build deterministic insights, fold the photo read in where it fits:
    //    highlights → strengths, improve → concerns, wellness → lifestyle.
    //    (Photo strings are already in the report language; the formula points
    //    stay translatable {key,params,text} objects — the client renders both.)
    const formulaInsights = deriveInsights(computed.metrics, computed.summary);
    const photoPointsByCategory = photoAnalysis
      ? {
          strengths: photoAnalysis.highlights,
          concerns: photoAnalysis.improve,
          lifestyle: photoAnalysis.wellness ? [photoAnalysis.wellness] : [],
          goals: photoAnalysis.progress ? [photoAnalysis.progress] : [],
        }
      : {};
    const insights = formulaInsights.map((fi) => ({
      ...fi,
      points: [...fi.points, ...(photoPointsByCategory[fi.category] || [])].slice(0, 5),
    }));

    // Tips as translatable { key, params, text } objects — the client renders
    // them in the current UI language. The photo's "improve" items ride along
    // first when available (already localized strings).
    const tips = [
      ...(photoAnalysis?.improve || []),
      { key: "tip_water", params: {}, text: "Match daily water intake to your hydration target." },
      { key: "tip_protein", params: {}, text: "Hit your protein target — split evenly across meals." },
      { key: "tip_sleep", params: {}, text: "Aim for 7-9 hours of sleep — recovery shapes composition more than training volume." },
    ].slice(0, 5);

    // 6. Build recommendations from TWO sources, deduped in priority order:
    //    (a) products mapped to EVERY selected health condition, (b) the
    //    metric-based engine. No fixed cap — the list scales with how many
    //    problems the user selected. (The coach photo prompt doesn't pick
    //    products; the deterministic engines cover it.)
    const mergedRecs = [];
    const seenRecIds = new Set();
    const pushRec = (rec) => {
      if (!rec?.product_id || seenRecIds.has(rec.product_id)) return;
      seenRecIds.add(rec.product_id);
      mergedRecs.push(rec);
    };
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

    // 7. Build results object stored to DB. `photo_analysis` carries the new
    //    coach photo read; the legacy note/enum fields stay null on new rows
    //    (old stored rows keep rendering through their own fields).
    const results = {
      overall_score: computed.overallScore,
      body_type: "balanced",
      summary: photoAnalysis?.analysis || `Wellness score ${computed.overallScore}/100 based on your biometrics.`,
      metrics: computed.metrics,
      computed_summary: computed.summary,
      insights,
      tips,
      routine_note: null,
      composition_note: null,
      posture_note: photoAnalysis?.posture || null,
      photo_quality_note: null,
      vision_details: null,
      photo_analysis: photoAnalysis,
      recommendations,
      enriched_products: enrichedProducts,
      vision_available: !!photoAnalysis,
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
