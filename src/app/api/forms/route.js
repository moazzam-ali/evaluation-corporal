import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { query } from "@/lib/db";
import { resolveBot } from "@/lib/bots";
import { sendAnalysisToTelegram } from "@/lib/telegram";
import { indexDocumentsInAppSearch, buildElasticDocuments } from "@/lib/elastic";
import { readFile } from "fs/promises";
import { join } from "path";

export const maxDuration = 60;

export async function POST(request) {
  const steps = {};

  try {
    const body = await request.json();
    const { formData, chatIDs, botIndex, accountIDs, contactIDs, lng } = body;

    if (!formData || !chatIDs?.length || !accountIDs?.length || !contactIDs?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = nanoid(22);
    const language = lng || "en";

    // 1. Store in PostgreSQL. Tolerate a missing `forms` table — the analysis
    // is what really matters and gets persisted later under `analyses`.
    steps.database = { status: "pending" };
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS forms (
           id VARCHAR(32) PRIMARY KEY,
           data JSONB NOT NULL,
           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      );
      await query(
        "INSERT INTO forms (id, data) VALUES ($1, $2)",
        [id, JSON.stringify(formData)]
      );
      steps.database = { status: "success" };
    } catch (dbError) {
      console.error("[forms] DB insert failed:", dbError.message);
      steps.database = { status: "failed", error: dbError.message };
      // Continue — Telegram + Elastic notifications still go out, and the
      // body-analysis endpoint will persist into the canonical `analyses` table.
    }

    // 2. Resolve bot
    steps.bot = { status: "pending" };
    let bot;
    try {
      bot = await resolveBot(botIndex, language);
      if (!bot) throw new Error("No bot found");
      steps.bot = { status: "success", botId: bot.id };
    } catch (botError) {
      console.error("[forms] Bot resolution failed:", botError.message);
      steps.bot = { status: "failed", error: botError.message };
    }

    // 3. Load backend translations
    steps.translations = { status: "pending" };
    let translations = {};
    try {
      const translationPath = join(process.cwd(), "public", "backend-locales", language, "translation.json");
      const raw = await readFile(translationPath, "utf-8");
      translations = JSON.parse(raw);
      steps.translations = { status: "success" };
    } catch (trError) {
      console.error("[forms] Translation load failed:", trError.message);
      steps.translations = { status: "failed", error: trError.message };
      // Try English fallback
      try {
        const fallbackPath = join(process.cwd(), "public", "backend-locales", "en", "translation.json");
        const raw = await readFile(fallbackPath, "utf-8");
        translations = JSON.parse(raw);
        steps.translations.fallback = "en";
      } catch {}
    }

    // 4. Send Telegram messages
    steps.telegram = { status: "pending" };
    let telegramResult = { telegramStatus: "skipped", answersText: "" };
    if (bot?.api_key) {
      try {
        telegramResult = await sendAnalysisToTelegram({
          chatIDs,
          bot,
          analysisData: { formData, results: null },
          translations,
          analysisId: id,
          language,
        });
        steps.telegram = { status: telegramResult.telegramStatus, failedChats: telegramResult.failedChats || [] };
      } catch (tgError) {
        console.error("[forms] Telegram failed:", tgError.message);
        steps.telegram = { status: "failed", error: tgError.message };
      }
    } else {
      steps.telegram = { status: "skipped", reason: "No bot configured" };
    }

    // 5. Index in Elasticsearch
    steps.elastic = { status: "pending" };
    try {
      const elasticDocs = buildElasticDocuments({
        formData,
        results: null,
        accountIDs,
        contactIDs,
        language,
        analysisId: id,
        answersText: telegramResult.answersText || JSON.stringify(formData),
      });
      const elasticResult = await indexDocumentsInAppSearch(elasticDocs);
      steps.elastic = { status: "success", docCount: elasticResult.length };
    } catch (esError) {
      console.error("[forms] Elastic indexing failed:", esError.message);
      steps.elastic = { status: "failed", error: esError.message };
    }

    // Determine overall status
    const allStatuses = Object.values(steps).map((s) => s.status);
    const hasFailed = allStatuses.some((s) => s === "failed");
    const allSuccess = allStatuses.every((s) => s === "success" || s === "skipped");
    const status = allSuccess ? "success" : hasFailed ? "partial_success" : "success";

    return NextResponse.json({
      id,
      status,
      steps,
      message: status === "success" ? "Form submitted successfully" : "Submitted with some issues",
    });
  } catch (error) {
    console.error("[forms] Unexpected error:", error);
    return NextResponse.json({ error: error.message || "Internal server error", steps }, { status: 500 });
  }
}
