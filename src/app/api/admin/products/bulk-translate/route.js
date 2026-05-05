import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getAllProducts, upsertTranslation } from "@/lib/products";
import { translateProductContent } from "@/lib/translate";
import { query } from "@/lib/db";

const LANGUAGES = ["es", "fr", "de", "it", "tr", "in", "pt"];

/**
 * POST /api/admin/products/bulk-translate
 * Body: { force?: boolean }
 *
 * Translates all active products into every language they support.
 * Skips existing translations unless force=true.
 */
export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { force = false } = await request.json().catch(() => ({}));

    const products = (await getAllProducts()).filter((p) => p.isActive);
    console.log(`[bulk-translate] Starting: ${products.length} active products, force=${force}`);

    // Get existing translations
    const { rows: existingRows } = await query(
      "SELECT product_id, language FROM product_translations"
    );
    const existing = new Set(existingRows.map((r) => `${r.product_id}:${r.language}`));

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    for (const product of products) {
      const englishContent = {
        name: product.name,
        benefits: product.benefits || [],
        key_ingredients: product.keyIngredients || [],
        how_to_use: product.howToUse || "",
        cautions: product.cautions || [],
      };

      const targetLangs = LANGUAGES.filter((lang) => (product.languages || []).includes(lang));

      for (const lang of targetLangs) {
        const key = `${product.id}:${lang}`;
        if (!force && existing.has(key)) {
          skipped++;
          continue;
        }

        try {
          const result = await translateProductContent(englishContent, lang);
          await upsertTranslation(product.id, lang, result);
          translated++;
          console.log(`[bulk-translate] ${product.id} → ${lang} ✓`);
        } catch (err) {
          failed++;
          errors.push({ product: product.id, language: lang, error: err.message });
          console.warn(`[bulk-translate] ${product.id} → ${lang} ✗ ${err.message}`);
        }
      }
    }

    console.log(`[bulk-translate] Done: ${translated} translated, ${skipped} skipped, ${failed} failed`);
    return NextResponse.json({ translated, skipped, failed, errors });
  } catch (err) {
    console.error("[bulk-translate] Fatal:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
