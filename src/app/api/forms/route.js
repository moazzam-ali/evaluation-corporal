import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { query } from "@/lib/db";

export const maxDuration = 30;

/**
 * POST /api/forms — persist the raw intake questionnaire early (before the
 * optional photo step) and hand back the id that the analysis will be stored
 * under. Coach notification (Telegram) and CRM indexing (Elastic) happen later
 * in /api/analyze-body, once the deterministic results exist and the report
 * link is guaranteed to resolve.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { formData } = body;

    if (!formData) {
      return NextResponse.json({ error: "Missing formData" }, { status: 400 });
    }

    const id = nanoid(22);

    // Store in PostgreSQL. Tolerate a missing/failed `forms` table — the
    // canonical record is persisted under the same id in `analyses` by the
    // body-analysis endpoint, so the flow continues regardless.
    let persisted = false;
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS forms (
           id VARCHAR(32) PRIMARY KEY,
           data JSONB NOT NULL,
           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      );
      await query("INSERT INTO forms (id, data) VALUES ($1, $2)", [id, JSON.stringify(formData)]);
      persisted = true;
    } catch (dbError) {
      console.error("[forms] DB insert failed:", dbError.message);
    }

    return NextResponse.json({ id, persisted, message: "Form saved" });
  } catch (error) {
    console.error("[forms] Unexpected error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
