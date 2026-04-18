import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getAllProducts, createProduct, upsertTranslation, deleteTranslation } from "@/lib/products";
import { translateProductContent } from "@/lib/translate";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await getAllProducts();
  return NextResponse.json({ products });
}

export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { translations, autoTranslateLanguages, removedLanguages, ...productData } = await request.json();
    const product = await createProduct(productData);
    const warnings = [];

    // Save manual translations
    if (translations) {
      for (const [lang, data] of Object.entries(translations)) {
        try {
          await upsertTranslation(product.id, lang, data);
        } catch (err) {
          warnings.push({ language: lang, error: err.message });
        }
      }
    }

    // Auto-translate languages with no manual data
    if (autoTranslateLanguages?.length > 0) {
      const englishContent = {
        name: productData.name,
        benefits: productData.benefits || [],
        key_ingredients: productData.key_ingredients || [],
        how_to_use: productData.how_to_use || "",
        cautions: productData.cautions || [],
      };
      for (const lang of autoTranslateLanguages) {
        try {
          const translated = await translateProductContent(englishContent, lang);
          await upsertTranslation(product.id, lang, translated);
        } catch (err) {
          console.warn(`[admin/products] Auto-translate ${lang} failed: ${err.message}`);
          warnings.push({ language: lang, error: err.message });
        }
      }
    }

    return NextResponse.json({ product, warnings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
