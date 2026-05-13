import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getProductById, updateProduct, deleteProduct, upsertTranslation, deleteTranslation } from "@/lib/products";
import { translateProductContent } from "@/lib/translate";

export async function GET(_, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const { translations, autoTranslateLanguages, removedLanguages, ...productData } = await request.json();
    const product = await updateProduct(id, productData);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const warnings = [];

    // Delete translations for removed languages
    if (removedLanguages?.length > 0) {
      for (const lang of removedLanguages) {
        try {
          await deleteTranslation(id, lang);
        } catch (err) {
          warnings.push({ language: lang, error: err.message });
        }
      }
    }

    // Save manual translations
    if (translations) {
      for (const [lang, data] of Object.entries(translations)) {
        try {
          await upsertTranslation(id, lang, data);
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
          await upsertTranslation(id, lang, translated);
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

export async function DELETE(_, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
