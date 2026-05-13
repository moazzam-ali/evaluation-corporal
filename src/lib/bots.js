import { query } from "./db";

/**
 * Get bot by ID. Returns { id, language, name, api_key } or null.
 */
export async function getBotById(id) {
  if (!id) return null;
  const r = await query(
    "SELECT id, language, name, api_key FROM bots WHERE id = $1 AND is_active = TRUE",
    [parseInt(id)]
  );
  return r.rows[0] || null;
}

/**
 * Get the default (first active) bot for a language. Returns the bot row or null.
 */
export async function getBotByLanguage(language) {
  if (!language) return null;
  const r = await query(
    `SELECT id, language, name, api_key
     FROM bots
     WHERE language = $1 AND is_active = TRUE
     ORDER BY id ASC LIMIT 1`,
    [language]
  );
  return r.rows[0] || null;
}

/**
 * Resolve which bot to use:
 * - If botIndex (id) is provided AND found, use it
 * - Otherwise fall back to first bot for the given language
 * Returns the bot row or null.
 */
export async function resolveBot(botIndex, language) {
  if (botIndex) {
    const byId = await getBotById(botIndex);
    if (byId) return byId;
  }
  return await getBotByLanguage(language);
}

/**
 * Get all bots (for admin panel listing).
 */
export async function getAllBots() {
  const r = await query(
    "SELECT id, language, name, api_key, is_active, created_at FROM bots ORDER BY id ASC"
  );
  return r.rows;
}
