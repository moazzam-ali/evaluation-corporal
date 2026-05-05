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
 * Sanitize user-provided text to escape Markdown special characters for Telegram.
 * Only applied to dynamic values, NOT to the template itself.
 */
function sanitizeValue(value) {
  if (!value || typeof value !== "string") return value || "";
  return value.replace(/[*_`~[\]()]/g, "");
}

/**
 * Sanitize an entire message (strips all Markdown). Used for plain-text exports only.
 */
function sanitizeMessage(message) {
  return message.replace(/[*_`~[\]()]/g, "");
}

/**
 * Send a message to a single Telegram chat with retry logic.
 * 3 attempts, exponential backoff.
 */
async function sendTelegramMessage(botApiKey, chatID, message, { inlineKeyboards, replyToMessageId } = {}, maxRetries = 3) {
  const telegramApiUrl = `https://api.telegram.org/bot${botApiKey}/sendMessage`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[telegram] Attempt ${attempt} to send message to chatID: ${chatID}`);

      const body = {
        chat_id: chatID,
        text: message,
        parse_mode: "Markdown",
      };

      if (replyToMessageId) {
        body.reply_to_message_id = replyToMessageId;
      }

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
 *   Message 1: Member details + Questionnaire summary
 *   Message 2: Analysis results + Report link with inline keyboard (reply to Message 1)
 */
export async function sendAnalysisToTelegram({
  chatIDs,
  bot,
  analysisData,
  translations,
  analysisId,
  language,
}) {
  if (!bot || !bot.api_key) {
    throw new Error("Bot configuration missing");
  }

  const botApiKey = bot.api_key;
  const defaultLanguage = bot.language;
  const t = (path) => getTranslation(translations, path);

  const { formData, results } = analysisData;

  // Sanitize a single user value
  const s = (val) => sanitizeValue(val);

  // Translate + sanitize array fields
  const translateArray = (arr, prefix) =>
    (arr || []).map((key) => s(t(`${prefix}.${key}`) || key)).join(", ") || "—";

  // Translate + sanitize a single enum value
  const translateField = (value, prefix) =>
    s(t(`${prefix}.${value}`) || value || "—");

  // ── Message 1: Member details ──
  let memberDetailsMessage = t("telegram.member_details") || "";
  memberDetailsMessage = memberDetailsMessage
    .replace("{name}", s(formData.name) || "Unknown")
    .replace("{surname}", s(formData.surname) || "Unknown")
    .replace("{email}", s(formData.email) || "Unknown")
    .replace("{phone}", s(formData.phone) || "Unknown")
    .replace("{birthDate}", s(formData.birthDate) || "Unknown")
    .replace("{country}", s(formData.country) || "Unknown")
    .replace("{city}", s(formData.city) || "Unknown");

  // ── Message 2: Questionnaire summary ──
  let questionnaireMessage = t("telegram.questionnaire_details") || "";
  questionnaireMessage = questionnaireMessage
    .replace("{skinConcerns}", translateArray(formData.skinConcerns, "telegram.form_fields.concerns"))
    .replace("{priorityConcern}", s(formData.priorityConcern) || "—")
    .replace("{improvementZones}", translateArray(formData.improvementZones, "telegram.form_fields.zones"))
    .replace("{skinType}", translateField(formData.skinType, "telegram.form_fields.skin_types"))
    .replace("{skinFeelGeneral}", translateField(formData.skinFeelGeneral, "telegram.form_fields.feel_general"))
    .replace("{skinFeelEndOfDay}", translateField(formData.skinFeelEndOfDay, "telegram.form_fields.feel_end_day"))
    .replace("{routineFrequency}", translateField(formData.routineFrequency, "telegram.form_fields.routine_frequency"))
    .replace("{productsUsed}", translateArray(formData.productsUsed, "telegram.form_fields.products"))
    .replace("{essentialProduct}", s(formData.essentialProduct) || "—")
    .replace("{missingProduct}", s(formData.missingProduct) || "—")
    .replace("{supplements}", s(formData.supplements) || "—")
    .replace("{reactionLevel}", translateField(formData.reactionLevel, "telegram.form_fields.reaction"))
    .replace("{recentSigns}", translateArray(formData.recentSigns, "telegram.form_fields.signs"))
    .replace("{sunscreenUse}", translateField(formData.sunscreenUse, "telegram.form_fields.sunscreen"))
    .replace("{makeupFrequency}", translateField(formData.makeupFrequency, "telegram.form_fields.makeup"))
    .replace("{sleepHours}", translateField(formData.sleepHours, "telegram.form_fields.sleep"))
    .replace("{stressImpact}", translateField(formData.stressImpact, "telegram.form_fields.stress"))
    .replace("{waterIntake}", translateField(formData.waterIntake, "telegram.form_fields.water"))
    .replace("{treatmentHistory}", translateField(formData.treatmentHistory, "telegram.form_fields.history"))
    .replace("{frustrations}", translateArray(formData.frustrations, "telegram.form_fields.frustrations"))
    .replace("{lookingFor}", translateField(formData.lookingFor, "telegram.form_fields.looking_for"))
    .replace("{wantRoutineRecommendation}", translateField(formData.wantRoutineRecommendation, "telegram.form_fields.recommendation"))
    .replace("{budgetLevel}", translateField(formData.budgetLevel, "telegram.form_fields.budget"));

  // ── Message 3: Analysis results with all metrics ──
  let analysisResultsMessage = t("telegram.analysis_results") || "";

  const metricsLines = (results.metrics || [])
    .map((m) => {
      const metricName = m.id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const statusIcon =
        m.score >= 80 ? "🟢" :
        m.score >= 60 ? "🟡" :
        m.score >= 40 ? "🟠" :
        "🔴";
      return `${statusIcon} ${metricName} — ${m.score}%`;
    })
    .join("\n");

  analysisResultsMessage = analysisResultsMessage
    .replace("{overall_score}", results.overall_score || "N/A")
    .replace("{skin_type_result}", s(t(`telegram.form_fields.skin_types.${results.skin_type}`) || results.skin_type || "Unknown"))
    .replace("{metrics}", metricsLines || "  No metrics available")
    .replace("{summary}", s(results.summary) || "");

  // Build the report URL — used by both the inline button and the Markdown link in the body.
  // Markdown link form `[text](url)` keeps underscores in the nanoid from being parsed as italic.
  const reportUrl = `https://beauty-glow-ai.vercel.app/results/${analysisId}?l=${language || defaultLanguage || "en"}`;

  // Inline keyboard buttons — View Report first so it's the most prominent action.
  const inlineKeyboards = [
    [{ text: t("telegram.buttons.view_report") || "📋 View Report", url: reportUrl }],
    [{ text: t("telegram.buttons.sms") || "📩 SMS", url: `https://sms.coachhbl.com/to?p=${encodeURIComponent(formData.phone || "")}` }],
    [{ text: t("telegram.buttons.call") || "📞 Call", url: `https://call.coachhbl.com/to?p=${encodeURIComponent(formData.phone || "")}` }],
    [{ text: t("telegram.buttons.whatsapp") || "💬 WhatsApp", url: `https://wa.me/${formData.phone || ""}` }],
  ];

  // 2 messages: client data (profile + questionnaire), results (analysis + report link).
  // The link is wrapped in Markdown link syntax so underscores in the nanoid don't break parsing.
  // Message 2 is sent as a reply to Message 1 to keep the thread visually connected.
  const reportLinkLabel = t("telegram.buttons.view_report") || "View Full Report";
  const messages = [
    memberDetailsMessage + "\n\n" + questionnaireMessage,
    analysisResultsMessage + `\n\n[${reportLinkLabel}](${reportUrl})`,
  ];

  // Build combined answers text for Elastic indexing (sanitized, no Markdown)
  const answersText = messages.map(sanitizeMessage).join("\n");

  // Send messages to all chat IDs, chaining each as a reply to the previous
  console.log("[telegram] Sending messages to", chatIDs.length, "chat IDs...");
  const results_ = [];
  const failedChats = [];

  for (const chatID of chatIDs) {
    try {
      let lastMessageId = null;
      for (let i = 0; i < messages.length; i++) {
        const keyboard = i === messages.length - 1 ? inlineKeyboards : undefined;
        const result = await sendTelegramMessage(botApiKey, chatID, messages[i], {
          inlineKeyboards: keyboard,
          replyToMessageId: lastMessageId,
        });
        // Capture message_id so the next message replies to this one
        lastMessageId = result?.result?.message_id || null;
      }
      results_.push({ chatID, success: true });
    } catch (error) {
      console.error(`[telegram] Failed to send to chatID ${chatID}:`, error.message);
      failedChats.push({ chatID, error: error.message });
    }
  }

  // Determine status
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
