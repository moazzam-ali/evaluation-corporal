import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing analysis ID" }, { status: 400 });
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
    return NextResponse.json({
      data: {
        id: row.id,
        formData: typeof row.form_data === "string" ? JSON.parse(row.form_data) : row.form_data,
        results: typeof row.results === "string" ? JSON.parse(row.results) : row.results,
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
