import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

/**
 * GET /api/products?lang=en
 *
 * Returns active products with translations applied for the given language.
 * Used by the homepage product grid to display translated product data.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";

  try {
    const products = await getProducts(lang);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[products] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
