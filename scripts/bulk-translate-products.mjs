#!/usr/bin/env node
/**
 * Bulk-translate all active products into every configured language.
 * Skips products that already have a translation for a given language.
 *
 * Usage:
 *   node scripts/bulk-translate-products.mjs           # translate missing only
 *   node scripts/bulk-translate-products.mjs --force    # re-translate everything
 *
 * Requires: DATABASE_URL and OPENAI_API_KEY in .env.local
 */

import "dotenv/config";
import pg from "pg";
import OpenAI from "openai";

const LANGUAGES = ["es", "fr", "de", "it", "tr", "in", "pt"];
const LANGUAGE_NAMES = {
  es: "Spanish", fr: "French", de: "German",
  it: "Italian", tr: "Turkish", in: "Hindi", pt: "Portuguese",
};

const force = process.argv.includes("--force");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function translateProduct(englishContent, targetLanguage) {
  const langName = LANGUAGE_NAMES[targetLanguage];
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional translator specializing in skincare and beauty products. Translate the following product content from English to ${langName}.

Rules:
- Preserve scientific/chemical ingredient names that are universally recognized (e.g., "Niacinamide", "Hyaluronic Acid", "Retinol", "CoQ10")
- Translate the "role" descriptions of ingredients naturally
- Keep the exact same JSON structure as the input
- "benefits" is an array of strings — translate each string
- "key_ingredients" is an array of objects with "name" and "role" — translate both fields (but keep universal scientific names)
- "how_to_use" is a single string — translate it
- "cautions" is an array of strings — translate each string
- "name" is the product display name — translate it naturally
- Output valid JSON only, no markdown`,
      },
      { role: "user", content: JSON.stringify(englishContent) },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = JSON.parse(content);
  return {
    name: parsed.name || englishContent.name,
    benefits: parsed.benefits || englishContent.benefits,
    key_ingredients: parsed.key_ingredients || englishContent.key_ingredients,
    how_to_use: parsed.how_to_use || englishContent.how_to_use,
    cautions: parsed.cautions || englishContent.cautions,
  };
}

async function main() {
  console.log(`\n🔄 Bulk product translation ${force ? "(FORCE mode — re-translating all)" : "(skip existing)"}\n`);

  // Get all active products
  const { rows: products } = await pool.query(
    "SELECT id, name, benefits, key_ingredients, how_to_use, cautions, languages FROM products WHERE is_active = TRUE ORDER BY display_order ASC"
  );
  console.log(`Found ${products.length} active products.\n`);

  // Get existing translations
  const { rows: existingRows } = await pool.query(
    "SELECT product_id, language FROM product_translations"
  );
  const existing = new Set(existingRows.map((r) => `${r.product_id}:${r.language}`));

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const englishContent = {
      name: product.name,
      benefits: product.benefits || [],
      key_ingredients: product.key_ingredients || [],
      how_to_use: product.how_to_use || "",
      cautions: product.cautions || [],
    };

    // Determine which languages this product needs
    const productLangs = product.languages || ["en"];
    const targetLangs = LANGUAGES.filter((lang) => productLangs.includes(lang));

    for (const lang of targetLangs) {
      const key = `${product.id}:${lang}`;
      if (!force && existing.has(key)) {
        skipped++;
        continue;
      }

      try {
        process.stdout.write(`  ${product.id} → ${lang}...`);
        const result = await translateProduct(englishContent, lang);

        await pool.query(
          `INSERT INTO product_translations (product_id, language, name, benefits, key_ingredients, how_to_use, cautions)
           VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb)
           ON CONFLICT (product_id, language) DO UPDATE SET
             name = $3, benefits = $4::jsonb, key_ingredients = $5::jsonb,
             how_to_use = $6, cautions = $7::jsonb`,
          [
            product.id, lang, result.name,
            JSON.stringify(result.benefits),
            JSON.stringify(result.key_ingredients),
            result.how_to_use,
            JSON.stringify(result.cautions),
          ]
        );

        console.log(` ✓`);
        translated++;
      } catch (err) {
        console.log(` ✗ ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n✅ Done: ${translated} translated, ${skipped} skipped, ${failed} failed.\n`);
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
