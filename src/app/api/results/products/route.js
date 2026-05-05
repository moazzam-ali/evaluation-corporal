import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { DEMO_ANALYSIS } from "@/lib/demo-data";
import { enrichRecommendations } from "@/lib/products";

/**
 * GET /api/results/products?id=<analysisId>&lang=<langCode>
 *
 * Lightweight endpoint that re-enriches product recommendations
 * for a given language. Used when the user switches language on
 * the results page so product data updates without re-fetching
 * the entire analysis.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const lang = searchParams.get("lang") || "en";

  if (!id) {
    return NextResponse.json({ error: "Missing analysis ID" }, { status: 400 });
  }

  try {
    let recommendations;

    if (id === "demo") {
      recommendations = DEMO_ANALYSIS.results.recommendations;
    } else {
      const result = await query(
        "SELECT results FROM analyses WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
      }
      const results = typeof result.rows[0].results === "string"
        ? JSON.parse(result.rows[0].results)
        : result.rows[0].results;
      recommendations = results.recommendations;
    }

    if (!recommendations) {
      return NextResponse.json({ enrichedProducts: [] });
    }

    const enrichedProducts = await enrichRecommendations(recommendations, lang);
    return NextResponse.json({ enrichedProducts });
  } catch (error) {
    console.error("[results/products] Error:", error.message);
    return NextResponse.json({ error: "Failed to enrich products" }, { status: 500 });
  }
}
