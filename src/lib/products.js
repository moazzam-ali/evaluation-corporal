// Server-side product service. All functions are async.
// Used in API routes; results are enriched server-side and returned to the client.
import { query } from "./db";

const SUPPORTED_LANGS = ["en", "es", "fr", "de", "it", "tr", "in", "pt"];

function rowToProduct(row, translation = null) {
  return {
    id: row.id,
    sku: row.sku,
    name: translation?.name || row.name,
    category: row.category,
    type: row.type,
    concernCategory: row.concern_category,
    size: row.size,
    image: row.image,
    concerns: row.concerns || [],
    benefits: translation?.benefits || row.benefits || [],
    keyIngredients: translation?.key_ingredients || row.key_ingredients || [],
    howToUse: translation?.how_to_use || row.how_to_use,
    cautions: translation?.cautions || row.cautions || [],
    routineStep: row.routine_step,
    languages: row.languages || [],
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

/**
 * Get all active products available in the given language.
 * If translations exist for that language, they override the default text.
 */
export async function getProducts(language = "en") {
  const lang = SUPPORTED_LANGS.includes(language) ? language : "en";
  const r = await query(
    `SELECT p.*, t.name as t_name, t.benefits as t_benefits,
            t.key_ingredients as t_key_ingredients, t.how_to_use as t_how_to_use,
            t.cautions as t_cautions
     FROM products p
     LEFT JOIN product_translations t ON t.product_id = p.id AND t.language = $1
     WHERE p.is_active = TRUE AND p.languages @> $2::jsonb
     ORDER BY p.display_order ASC, p.id ASC`,
    [lang, JSON.stringify([lang])]
  );
  return r.rows.map((row) => rowToProduct(row, extractTranslation(row)));
}

/**
 * Get all products (active + inactive) for the admin panel.
 */
export async function getAllProducts() {
  const r = await query(
    "SELECT * FROM products ORDER BY display_order ASC, id ASC"
  );
  return r.rows.map((row) => rowToProduct(row));
}

/**
 * Get a single product by id, with translation merged for the given language.
 */
export async function getProductById(id, language = "en") {
  const lang = SUPPORTED_LANGS.includes(language) ? language : "en";
  const r = await query(
    `SELECT p.*, t.name as t_name, t.benefits as t_benefits,
            t.key_ingredients as t_key_ingredients, t.how_to_use as t_how_to_use,
            t.cautions as t_cautions
     FROM products p
     LEFT JOIN product_translations t ON t.product_id = p.id AND t.language = $1
     WHERE p.id = $2`,
    [lang, id]
  );
  if (r.rows.length === 0) return null;
  return rowToProduct(r.rows[0], extractTranslation(r.rows[0]));
}

function extractTranslation(row) {
  if (!row.t_name && !row.t_benefits && !row.t_how_to_use) return null;
  return {
    name: row.t_name,
    benefits: row.t_benefits,
    key_ingredients: row.t_key_ingredients,
    how_to_use: row.t_how_to_use,
    cautions: row.t_cautions,
  };
}

/**
 * Get list of product IDs available for a language (used by the AI prompt).
 */
export async function getProductIdsForLanguage(language = "en") {
  const lang = SUPPORTED_LANGS.includes(language) ? language : "en";
  const r = await query(
    `SELECT id FROM products
     WHERE is_active = TRUE AND languages @> $1::jsonb
     ORDER BY display_order ASC`,
    [JSON.stringify([lang])]
  );
  return r.rows.map((row) => row.id);
}

/**
 * Enrich AI-returned recommendations with full product data.
 * Filters out any product not available in the given language.
 */
export async function enrichRecommendations(recommendations, language = "en") {
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }
  const ids = recommendations.map((r) => r.product_id);
  const lang = SUPPORTED_LANGS.includes(language) ? language : "en";

  const r = await query(
    `SELECT p.*, t.name as t_name, t.benefits as t_benefits,
            t.key_ingredients as t_key_ingredients, t.how_to_use as t_how_to_use,
            t.cautions as t_cautions
     FROM products p
     LEFT JOIN product_translations t ON t.product_id = p.id AND t.language = $1
     WHERE p.id = ANY($2::text[]) AND p.is_active = TRUE`,
    [lang, ids]
  );

  const productMap = new Map(
    r.rows.map((row) => [row.id, rowToProduct(row, extractTranslation(row))])
  );

  return recommendations
    .map((rec) => {
      const product = productMap.get(rec.product_id);
      if (!product) return null;
      return { ...product, priority: rec.priority, reason: rec.reason };
    })
    .filter(Boolean);
}

/**
 * Deterministic recommendation engine — given metric scores, return ranked products.
 * Used as a fallback if AI doesn't return recommendations.
 */
export async function getProductsForMetrics(metrics, language = "en") {
  const lang = SUPPORTED_LANGS.includes(language) ? language : "en";
  const lowMetrics = metrics.filter((m) => m.score < 80);
  if (lowMetrics.length === 0) return [];

  const metricIds = lowMetrics.map((m) => m.id);
  const mapResult = await query(
    `SELECT metric_id, product_id, priority
     FROM metric_product_map
     WHERE metric_id = ANY($1::text[]) AND (language = '_all_' OR language = $2)`,
    [metricIds, lang]
  );

  const scored = new Map();
  for (const row of mapResult.rows) {
    const metric = lowMetrics.find((m) => m.id === row.metric_id);
    const weight = metric.score < 40 ? 3 : metric.score < 60 ? 2 : 1;
    scored.set(row.product_id, (scored.get(row.product_id) || 0) + weight);
  }

  const sortedIds = Array.from(scored.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const products = await Promise.all(sortedIds.map((id) => getProductById(id, lang)));
  return products.filter((p) => p && p.languages.includes(lang)).map((p, i) => ({ ...p, priority: i + 1 }));
}

/**
 * CRUD for admin panel.
 */
export async function createProduct(data) {
  const r = await query(
    `INSERT INTO products (
       id, sku, name, category, type, concern_category, size, image,
       concerns, benefits, key_ingredients, how_to_use, cautions,
       routine_step, languages, is_active, display_order
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,
       $9::jsonb,$10::jsonb,$11::jsonb,$12,$13::jsonb,
       $14::jsonb,$15::jsonb,$16,$17
     )
     RETURNING *`,
    [
      data.id, data.sku, data.name, data.category, data.type,
      data.concern_category || null, data.size || null, data.image || null,
      JSON.stringify(data.concerns || []),
      JSON.stringify(data.benefits || []),
      JSON.stringify(data.key_ingredients || []),
      data.how_to_use || null,
      JSON.stringify(data.cautions || []),
      data.routine_step ? JSON.stringify(data.routine_step) : null,
      JSON.stringify(data.languages || ["en"]),
      data.is_active ?? true,
      data.display_order || 0,
    ]
  );
  return rowToProduct(r.rows[0]);
}

export async function updateProduct(id, data) {
  const r = await query(
    `UPDATE products SET
       sku = $2, name = $3, category = $4, type = $5,
       concern_category = $6, size = $7, image = $8,
       concerns = $9::jsonb, benefits = $10::jsonb, key_ingredients = $11::jsonb,
       how_to_use = $12, cautions = $13::jsonb, routine_step = $14::jsonb,
       languages = $15::jsonb, is_active = $16, display_order = $17,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id, data.sku, data.name, data.category, data.type,
      data.concern_category || null, data.size || null, data.image || null,
      JSON.stringify(data.concerns || []),
      JSON.stringify(data.benefits || []),
      JSON.stringify(data.key_ingredients || []),
      data.how_to_use || null,
      JSON.stringify(data.cautions || []),
      data.routine_step ? JSON.stringify(data.routine_step) : null,
      JSON.stringify(data.languages || ["en"]),
      data.is_active ?? true,
      data.display_order || 0,
    ]
  );
  return r.rows[0] ? rowToProduct(r.rows[0]) : null;
}

export async function deleteProduct(id) {
  await query("DELETE FROM products WHERE id = $1", [id]);
  return true;
}

// ------------------------------------------------------------------
// Translation CRUD
// ------------------------------------------------------------------

/**
 * Get all translations for a product, keyed by language.
 * Returns e.g. { es: { name, benefits, key_ingredients, how_to_use, cautions }, fr: { ... } }
 */
export async function getTranslationsForProduct(productId) {
  const r = await query(
    "SELECT language, name, benefits, key_ingredients, how_to_use, cautions FROM product_translations WHERE product_id = $1",
    [productId]
  );
  const translations = {};
  for (const row of r.rows) {
    translations[row.language] = {
      name: row.name,
      benefits: row.benefits || [],
      key_ingredients: row.key_ingredients || [],
      how_to_use: row.how_to_use || "",
      cautions: row.cautions || [],
    };
  }
  return translations;
}

/**
 * Create or update a translation for a product + language pair.
 */
export async function upsertTranslation(productId, language, data) {
  await query(
    `INSERT INTO product_translations (product_id, language, name, benefits, key_ingredients, how_to_use, cautions)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb)
     ON CONFLICT (product_id, language) DO UPDATE SET
       name = $3, benefits = $4::jsonb, key_ingredients = $5::jsonb,
       how_to_use = $6, cautions = $7::jsonb`,
    [
      productId,
      language,
      data.name || null,
      JSON.stringify(data.benefits || []),
      JSON.stringify(data.key_ingredients || []),
      data.how_to_use || null,
      JSON.stringify(data.cautions || []),
    ]
  );
}

/**
 * Delete a single translation for a product + language pair.
 */
export async function deleteTranslation(productId, language) {
  await query(
    "DELETE FROM product_translations WHERE product_id = $1 AND language = $2",
    [productId, language]
  );
}
