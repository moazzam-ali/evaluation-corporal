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

  // Helper to translate array fields
  const translateArray = (arr, prefix) =>
    (arr || []).map((key) => t(`${prefix}.${key}`) || key).join(", ") || "—";

  // Build Message 1: Member details
  let memberDetailsMessage = t("telegram.member_details") || "";
  memberDetailsMessage = memberDetailsMessage
    .replace("{name}", formData.name || "Unknown")
    .replace("{surname}", formData.surname || "Unknown")
    .replace("{email}", formData.email || "Unknown")
    .replace("{phone}", formData.phone || "Unknown")
    .replace("{birthDate}", formData.birthDate || "Unknown")
    .replace("{country}", formData.country || "Unknown")
    .replace("{city}", formData.city || "Unknown");

  // Build Message 2: Questionnaire summary
  let questionnaireMessage = t("telegram.questionnaire_details") || "";
  questionnaireMessage = questionnaireMessage
    .replace("{skinConcerns}", translateArray(formData.skinConcerns, "telegram.form_fields.concerns"))
    .replace("{priorityConcern}", formData.priorityConcern || "—")
    .replace("{improvementZones}", translateArray(formData.improvementZones, "telegram.form_fields.zones"))
    .replace("{skinType}", t(`telegram.form_fields.skin_types.${formData.skinType}`) || formData.skinType || "Unknown")
    .replace("{skinFeelGeneral}", t(`telegram.form_fields.feel_general.${formData.skinFeelGeneral}`) || formData.skinFeelGeneral || "—")
    .replace("{skinFeelEndOfDay}", t(`telegram.form_fields.feel_end_day.${formData.skinFeelEndOfDay}`) || formData.skinFeelEndOfDay || "—")
    .replace("{routineFrequency}", t(`telegram.form_fields.routine_frequency.${formData.routineFrequency}`) || formData.routineFrequency || "—")
    .replace("{productsUsed}", translateArray(formData.productsUsed, "telegram.form_fields.products"))
    .replace("{essentialProduct}", formData.essentialProduct || "—")
    .replace("{missingProduct}", formData.missingProduct || "—")
    .replace("{supplements}", formData.supplements || "—")
    .replace("{retinoidPreference}", t(`telegram.form_fields.retinoid.${formData.retinoidPreference}`) || formData.retinoidPreference || "—")
    .replace("{reactionLevel}", t(`telegram.form_fields.reaction.${formData.reactionLevel}`) || formData.reactionLevel || "—")
    .replace("{recentSigns}", translateArray(formData.recentSigns, "telegram.form_fields.signs"))
    .replace("{sunscreenUse}", t(`telegram.form_fields.sunscreen.${formData.sunscreenUse}`) || formData.sunscreenUse || "—")
    .replace("{makeupFrequency}", t(`telegram.form_fields.makeup.${formData.makeupFrequency}`) || formData.makeupFrequency || "—")
    .replace("{sleepHours}", t(`telegram.form_fields.sleep.${formData.sleepHours}`) || formData.sleepHours || "—")
    .replace("{stressImpact}", t(`telegram.form_fields.stress.${formData.stressImpact}`) || formData.stressImpact || "—")
    .replace("{waterIntake}", t(`telegram.form_fields.water.${formData.waterIntake}`) || formData.waterIntake || "—")
    .replace("{treatmentHistory}", t(`telegram.form_fields.history.${formData.treatmentHistory}`) || formData.treatmentHistory || "—")
    .replace("{frustrations}", translateArray(formData.frustrations, "telegram.form_fields.frustrations"))
    .replace("{lookingFor}", t(`telegram.form_fields.looking_for.${formData.lookingFor}`) || formData.lookingFor || "—")
    .replace("{wantRoutineRecommendation}", t(`telegram.form_fields.recommendation.${formData.wantRoutineRecommendation}`) || formData.wantRoutineRecommendation || "—")
    .replace("{budgetLevel}", t(`telegram.form_fields.budget.${formData.budgetLevel}`) || formData.budgetLevel || "—");

  // Build Message 3: Analysis results
  let analysisResultsMessage = t("telegram.analysis_results") || "";

  const concerns = (results.metrics || [])
    .filter((m) => m.status === "needs_attention")
    .map((m) => {
      const metricName = m.id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return `  - ${metricName}: ${m.score}% (${t(`telegram.form_fields.status.${m.status}`) || m.status})`;
    })
    .join("\n");

  analysisResultsMessage = analysisResultsMessage
    .replace("{overall_score}", results.overall_score || "N/A")
    .replace("{skin_type_result}", t(`telegram.form_fields.skin_types.${results.skin_type}`) || results.skin_type || "Unknown")
    .replace("{concerns}", concerns || "  None detected")
    .replace("{summary}", results.summary || "");

  // Build Message 4: Analysis link
  let analysisLinkMessage = t("telegram.analysis_link") || "";
  analysisLinkMessage = analysisLinkMessage
    .replace("{id}", analysisId)
    .replace("{lng}", language || defaultLanguage || "en");

  // Inline keyboard buttons
  const inlineKeyboards = [
    [{ text: t("telegram.buttons.sms") || "SMS", url: `https://sms.coachhbl.com/to?p=${encodeURIComponent(formData.phone || "")}` }],
    [{ text: t("telegram.buttons.call") || "Call", url: `https://call.coachhbl.com/to?p=${encodeURIComponent(formData.phone || "")}` }],
    [{ text: t("telegram.buttons.whatsapp") || "WhatsApp", url: `https://wa.me/${formData.phone || ""}` }],
    [{ text: t("telegram.buttons.telegram") || "Telegram", url: `https://t.me/${formData.phone || ""}` }],
  ];

  // 4 messages: member details, questionnaire, AI results, link with keyboard
  const messages = [
    memberDetailsMessage,
    questionnaireMessage,
    analysisResultsMessage,
    analysisLinkMessage,
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
        // Attach inline keyboard only with the last message
        const keyboard = i === messages.length - 1 ? inlineKeyboards : undefined;
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
