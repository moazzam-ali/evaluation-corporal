import { query } from "./db";

function sanitizeMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

async function sendTelegramMessage(botApiKey, chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }

  let lastError;
  const delays = [1000, 2000, 10000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botApiKey}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) return { success: true };

      const data = await response.json();
      lastError = data.description || "Unknown Telegram error";
    } catch (err) {
      lastError = err.message;
    }

    if (attempt < delays.length) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }

  return { success: false, error: lastError };
}

export async function sendAnalysisToTelegram({
  chatIDs,
  botIndex,
  analysisData,
  resultsUrl,
  translations,
}) {
  // Fetch bot config
  const botResult = await query("SELECT bot_api_key, language FROM bots WHERE id = $1", [botIndex]);
  if (botResult.rows.length === 0) {
    throw new Error(`Bot with index ${botIndex} not found`);
  }

  const { bot_api_key } = botResult.rows[0];
  const t = translations;

  const { formData, results } = analysisData;
  const safe = (val) => sanitizeMarkdown(String(val || "N/A"));

  // Message 1: User details
  const message1 = [
    `*${t("telegram.new_analysis") || "New Skin Analysis"}*`,
    "",
    `*${t("telegram.name") || "Name"}:* ${safe(formData.name)} ${safe(formData.surname)}`,
    `*${t("telegram.email") || "Email"}:* ${safe(formData.email)}`,
    `*${t("telegram.phone") || "Phone"}:* ${safe(formData.phone)}`,
    `*${t("telegram.age") || "Age"}:* ${safe(formData.age)}`,
    `*${t("telegram.skin_type") || "Skin Type"}:* ${safe(formData.skin_type)}`,
    "",
    `*${t("telegram.overall_score") || "Overall Score"}:* ${results.overall_score}%`,
  ].join("\n");

  // Message 2: Top concerns
  const concerns = results.metrics
    .filter((m) => m.status === "needs_attention")
    .map((m) => `  - ${m.label || m.id}: ${m.score}%`)
    .join("\n");

  const message2 = [
    `*${t("telegram.concerns") || "Key Concerns"}:*`,
    concerns || "  None detected",
    "",
    `*${t("telegram.recommendations") || "Recommended Products"}:*`,
    ...(results.recommendations || []).map(
      (r) => `  - ${r.product_name || r.product_id}`
    ),
  ].join("\n");

  // Message 3: Link with inline keyboard
  const message3 = `*${t("telegram.view_report") || "View Full Report"}:*\n${resultsUrl}`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "View Report", url: resultsUrl },
      ],
    ],
  };

  const results_ = [];
  const failedChats = [];

  for (const chatId of chatIDs) {
    const r1 = await sendTelegramMessage(bot_api_key, chatId, message1);
    const r2 = await sendTelegramMessage(bot_api_key, chatId, message2);
    const r3 = await sendTelegramMessage(bot_api_key, chatId, message3, inlineKeyboard);

    if (r1.success && r2.success && r3.success) {
      results_.push({ chatId, status: "success" });
    } else {
      failedChats.push({ chatId, errors: [r1.error, r2.error, r3.error].filter(Boolean) });
    }
  }

  return {
    telegramStatus: failedChats.length === 0 ? "success" : results_.length > 0 ? "partial" : "failed",
    results: results_,
    failedChats,
  };
}
