import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { DEMO_ANALYSIS } from "@/lib/demo-data";
import { enrichRecommendations } from "@/lib/products";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing analysis ID" }, { status: 400 });
  }

  // Demo data — enrich with current DB products
  if (id === "demo") {
    const data = { ...DEMO_ANALYSIS };
    try {
      data.results = {
        ...data.results,
        enriched_products: await enrichRecommendations(
          data.results.recommendations,
          data.language || "en"
        ),
      };
    } catch (err) {
      console.warn("[results] Demo enrichment failed:", err.message);
    }
    return NextResponse.json({ data });
  }

  try {
    const result = await query(
      "SELECT id, form_data, results, image_url, language, created_at FROM analyses WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const results = typeof row.results === "string" ? JSON.parse(row.results) : row.results;

    // If stored analysis doesn't have enriched_products yet, enrich on the fly
    if (!results.enriched_products && results.recommendations) {
      try {
        results.enriched_products = await enrichRecommendations(
          results.recommendations,
          row.language || "en"
        );
      } catch (err) {
        console.warn("[results] Enrichment failed:", err.message);
        results.enriched_products = [];
      }
    }

    return NextResponse.json({
      data: {
        id: row.id,
        formData: typeof row.form_data === "string" ? JSON.parse(row.form_data) : row.form_data,
        results,
        imageUrl: row.image_url,
        language: row.language,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
