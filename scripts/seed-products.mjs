// Seeds products from src/data/products.json into the products table.
// Sets all products as available in all 8 supported languages by default.
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SUPPORTED_LANGS = ["en", "es", "fr", "de", "it", "tr", "in", "pt"];

async function main() {
  const products = JSON.parse(
    readFileSync(join(__dirname, "..", "src", "data", "products.json"), "utf-8")
  );

  const client = await pool.connect();
  try {
    console.log(`📦 Seeding ${products.length} products...`);
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await client.query(
        `INSERT INTO products (
           id, sku, name, category, type, concern_category, size, image,
           concerns, benefits, key_ingredients, how_to_use, cautions,
           routine_step, languages, display_order
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9::jsonb, $10::jsonb, $11::jsonb, $12, $13::jsonb,
           $14::jsonb, $15::jsonb, $16
         )
         ON CONFLICT (id) DO UPDATE SET
           sku = EXCLUDED.sku,
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           type = EXCLUDED.type,
           concern_category = EXCLUDED.concern_category,
           size = EXCLUDED.size,
           image = EXCLUDED.image,
           concerns = EXCLUDED.concerns,
           benefits = EXCLUDED.benefits,
           key_ingredients = EXCLUDED.key_ingredients,
           how_to_use = EXCLUDED.how_to_use,
           cautions = EXCLUDED.cautions,
           routine_step = EXCLUDED.routine_step,
           updated_at = NOW()`,
        [
          p.id,
          p.sku,
          p.name,
          p.category,
          p.type,
          p.concernCategory || null,
          p.size || null,
          p.image || null,
          JSON.stringify(p.concerns || []),
          JSON.stringify(p.benefits || []),
          JSON.stringify(p.keyIngredients || []),
          p.howToUse || null,
          JSON.stringify(p.cautions || []),
          p.routineStep ? JSON.stringify(p.routineStep) : null,
          JSON.stringify(SUPPORTED_LANGS),
          i,
        ]
      );
      console.log(`  ✅ ${p.id} (${p.sku})`);
    }
    console.log(`\n🎉 Seeded ${products.length} products`);

    // Seed the metric → product map here (after products exist) so the
    // metric_product_map.product_id foreign key is always satisfied.
    console.log("\n🔗 Seeding metric-product map...");
    const MAP = JSON.parse(
      readFileSync(join(__dirname, "..", "src", "data", "metric-product-map.json"), "utf-8")
    );
    let mapCount = 0;
    for (const [metricId, productIds] of Object.entries(MAP)) {
      for (let i = 0; i < productIds.length; i++) {
        await client.query(
          `INSERT INTO metric_product_map (metric_id, product_id, priority, language)
           VALUES ($1, $2, $3, '_all_')
           ON CONFLICT DO NOTHING`,
          [metricId, productIds[i], i + 1]
        );
        mapCount++;
      }
    }
    console.log(`✅ Seeded ${mapCount} metric-product associations`);

    // Seed committed product translations (src/data/product-translations.json),
    // keyed by product id → language → { name, benefits, key_ingredients,
    // how_to_use, cautions }. Optional file — skipped cleanly if absent.
    console.log("\n🌍 Seeding product translations...");
    let trCount = 0;
    try {
      const TRANSLATIONS = JSON.parse(
        readFileSync(join(__dirname, "..", "src", "data", "product-translations.json"), "utf-8")
      );
      for (const [productId, langs] of Object.entries(TRANSLATIONS)) {
        for (const [language, c] of Object.entries(langs)) {
          await client.query(
            `INSERT INTO product_translations (product_id, language, name, benefits, key_ingredients, how_to_use, cautions)
             VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb)
             ON CONFLICT (product_id, language) DO UPDATE SET
               name = EXCLUDED.name,
               benefits = EXCLUDED.benefits,
               key_ingredients = EXCLUDED.key_ingredients,
               how_to_use = EXCLUDED.how_to_use,
               cautions = EXCLUDED.cautions`,
            [
              productId,
              language,
              c.name || null,
              JSON.stringify(c.benefits || []),
              JSON.stringify(c.key_ingredients || []),
              c.how_to_use || null,
              JSON.stringify(c.cautions || []),
            ]
          );
          trCount++;
        }
      }
      console.log(`✅ Seeded ${trCount} product translations`);
    } catch (e) {
      console.warn(`⚠ Skipped product translations: ${e.message}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
