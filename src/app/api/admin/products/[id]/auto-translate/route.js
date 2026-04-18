import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getProductById, upsertTranslation } from "@/lib/products";
import { translateProductContent } from "@/lib/translate";

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { language } = await request.json();

    if (!language || language === "en") {
      return NextResponse.json({ error: "Provide a non-English language code" }, { status: 400 });
    }

    // Fetch the English base product
    const product = await getProductById(id, "en");
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const englishContent = {
      name: product.name,
      benefits: product.benefits || [],
      key_ingredients: product.keyIngredients || [],
      how_to_use: product.howToUse || "",
      cautions: product.cautions || [],
    };

    console.log(`[auto-translate] Translating product "${id}" to ${language}`);
    const translated = await translateProductContent(englishContent, language);

    // Save to database
    await upsertTranslation(id, language, translated);
    console.log(`[auto-translate] Saved ${language} translation for "${id}"`);

    return NextResponse.json({ translation: translated });
  } catch (err) {
    console.error("[auto-translate] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
