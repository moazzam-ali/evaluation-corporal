import { query } from "./db";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Safely access nested translation keys like "telegram.buttons.sms"
 */
function getTranslation(translations, path) {
  const parts = path.split(".");
  let current = translations;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Sanitize text to remove Markdown special characters for Telegram.
 */
function sanitizeMessage(message) {
  return message.replace(/[*_`~[\]()]/g, "");
}

/**
 * Send a message to a single Telegram chat with retry logic.
 * Matches the nutritional project's retry pattern: 3 attempts, exponential backoff.
 */
async function sendTelegramMessage(botApiKey, chatID, message, inlineKeyboards, maxRetries = 3) {
  const telegramApiUrl = `https://api.telegram.org/bot${botApiKey}/sendMessage`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[telegram] Attempt ${attempt} to send message to chatID: ${chatID}`);

      const body = {
        chat_id: chatID,
        text: sanitizeMessage(message),
        parse_mode: "Markdown",
      };

      if (inlineKeyboards) {
        body.reply_markup = { inline_keyboard: inlineKeyboards };
      }

      const response = await fetch(telegramApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log(`[telegram] Successfully sent message to chatID: ${chatID}`);
      return result;
    } catch (error) {
      console.error(`[telegram] Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw new Error(`Failed to send message after ${maxRetries} attempts: ${error.message}`);
      }

      const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[telegram] Waiting ${backoffDelay}ms before retry...`);
      await delay(backoffDelay);
    }
  }
}

/**
 * Build and send Telegram messages for a skin analysis.
 * Follows the nutritional project pattern:
 *   Message 1: Member details + analysis results
 *   Message 2: Key concerns + product recommendations
 *   Message 3: Analysis link with inline keyboard (SMS, Call, WhatsApp, Telegram)
 */
export async function sendAnalysisToTelegram({
  chatIDs,
  botIndex,
  analysisData,
  translations,
  analysisId,
  language,
}) {
  // Fetch bot config from DB
  const botResult = await query("SELECT bot_api_key, language FROM bots WHERE id = $1", [botIndex]);
  if (botResult.rows.length === 0) {
    throw new Error(`Bot with index ${botIndex} not found`);
  }

  const { bot_api_key: botApiKey, language: defaultLanguage } = botResult.rows[0];
  const t = (path) => getTranslation(translations, path);

  const { formData, results } = analysisData;

  // Build Message 1: Member details
  let memberDetailsMessage = t("telegram.member_details") || "";
  memberDetailsMessage = memberDetailsMessage
    .replace("{name}", formData.name || "Unknown")
    .replace("{surname}", formData.surname || "Unknown")
    .replace("{email}", formData.email || "Unknown")
    .replace("{phone}", formData.phone || "Unknown")
    .replace("{age}", formData.age || "Unknown")
    .replace(
      "{skin_type}",
      t(`telegram.form_fields.skin_types.${formData.skin_type}`) || formData.skin_type || "Unknown"
    );

  // Build Message 2: Analysis results
  let analysisResultsMessage = t("telegram.analysis_results") || "";

  // Build concerns list
  const concerns = (results.metrics || [])
    .filter((m) => m.status === "needs_attention")
    .map((m) => {
      const metricName = m.id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return `  - ${metricName}: ${m.score}% (${t(`telegram.form_fields.status.${m.status}`) || m.status})`;
    })
    .join("\n");

  analysisResultsMessage = analysisResultsMessage
    .replace("{overall_score}", results.overall_score || "N/A")
    .replace(
      "{skin_type_result}",
      t(`telegram.form_fields.skin_types.${results.skin_type}`) || results.skin_type || "Unknown"
    )
    .replace("{concerns}", concerns || "  None detected")
    .replace("{summary}", results.summary || "");

  // Build Message 3: Analysis link
  let analysisLinkMessage = t("telegram.analysis_link") || "";
  analysisLinkMessage = analysisLinkMessage
    .replace("{id}", analysisId)
    .replace("{lng}", language || defaultLanguage || "en");

  // Inline keyboard buttons (same pattern as nutritional project)
  const inlineKeyboards = [
    [
      {
        text: t("telegram.buttons.sms") || "SMS",
        url: `https://sms.coachhbl.com/to?p=${encodeURIComponent(formData.phone || "")}`,
      },
    ],
    [
      {
        text: t("telegram.buttons.call") || "Call",
        url: `https://call.coachhbl.com/to?p=${encodeURIComponent(formData.phone || "")}`,
      },
    ],
    [
      {
        text: t("telegram.buttons.whatsapp") || "WhatsApp",
        url: `https://wa.me/${formData.phone || ""}`,
      },
    ],
    [
      {
        text: t("telegram.buttons.telegram") || "Telegram",
        url: `https://t.me/${formData.phone || ""}`,
      },
    ],
  ];

  // Prepare 3 messages (same structure as nutritional project)
  const messages = [
    memberDetailsMessage,          // Message 1: Member details
    analysisResultsMessage,        // Message 2: Analysis results + concerns
    analysisLinkMessage,           // Message 3: Link with inline keyboard
  ];

  // Build combined answers text for Elastic indexing (sanitized, no Markdown)
  const answersText = messages.map(sanitizeMessage).join("\n");

  // Send messages to all chat IDs
  console.log("[telegram] Sending messages to", chatIDs.length, "chat IDs...");
  const results_ = [];
  const failedChats = [];

  for (const chatID of chatIDs) {
    try {
      for (let i = 0; i < messages.length; i++) {
        // Attach inline keyboard only with the third message
        const keyboard = i === 2 ? inlineKeyboards : undefined;
        await sendTelegramMessage(botApiKey, chatID, messages[i], keyboard);
      }
      results_.push({ chatID, success: true });
    } catch (error) {
      console.error(`[telegram] Failed to send to chatID ${chatID}:`, error.message);
      failedChats.push({ chatID, error: error.message });
    }
  }

  // Determine status (same as nutritional project)
  let telegramStatus;
  if (failedChats.length === 0) {
    telegramStatus = "success";
  } else if (failedChats.length === chatIDs.length) {
    telegramStatus = "failed";
  } else {
    telegramStatus = "partial";
  }

  return {
    telegramStatus,
    results: results_,
    failedChats,
    answersText,
  };
}

export { getTranslation, sanitizeMessage };
