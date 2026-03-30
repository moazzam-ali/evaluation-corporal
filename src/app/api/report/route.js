import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request) {
  try {
    const { analysisId, email } = await request.json();

    if (!analysisId || !email) {
      return NextResponse.json({ error: "Missing analysisId or email" }, { status: 400 });
    }

    // Fetch analysis data
    const result = await query(
      "SELECT id, form_data, results, language FROM analyses WHERE id = $1",
      [analysisId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const formData = typeof row.form_data === "string" ? JSON.parse(row.form_data) : row.form_data;
    const results = typeof row.results === "string" ? JSON.parse(row.results) : row.results;
    const isSpanish = row.language === "es";

    // Store email in DB
    await query(
      "UPDATE analyses SET email = $1 WHERE id = $2",
      [email, analysisId]
    );

    // Build email HTML
    const metricsHtml = results.metrics
      .map((m) => {
        const color = m.status === "good" ? "#22c55e" : m.status === "normal" ? "#f59e0b" : "#ef4444";
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${m.id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center"><span style="color:${color};font-weight:bold">${m.score}%</span></td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;color:#666">${m.insight}</td>
        </tr>`;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#22c55e;text-align:center">${isSpanish ? "Tu Análisis de Piel HL/Skin" : "Your HL/Skin Analysis"}</h1>
        <div style="text-align:center;padding:20px;background:#f0fdf4;border-radius:12px;margin:20px 0">
          <p style="font-size:14px;color:#666;margin:0">${isSpanish ? "Puntuación General" : "Overall Score"}</p>
          <p style="font-size:48px;font-weight:bold;color:#22c55e;margin:8px 0">${results.overall_score}%</p>
          <p style="font-size:14px;color:#666;margin:0">${isSpanish ? "Tipo de Piel" : "Skin Type"}: ${results.skin_type}</p>
        </div>
        <h2>${isSpanish ? "Métricas Detalladas" : "Detailed Metrics"}</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left">${isSpanish ? "Métrica" : "Metric"}</th>
              <th style="padding:8px;text-align:center">${isSpanish ? "Puntuación" : "Score"}</th>
              <th style="padding:8px;text-align:left">${isSpanish ? "Observación" : "Insight"}</th>
            </tr>
          </thead>
          <tbody>${metricsHtml}</tbody>
        </table>
        <div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px">
          <h3>${isSpanish ? "Resumen" : "Summary"}</h3>
          <p style="font-size:14px;color:#333">${results.summary}</p>
        </div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
        <p style="font-size:12px;color:#999;text-align:center">
          ${isSpanish
            ? "Esta herramienta es solo para fines de concienciación cosmética. Los resultados no sustituyen el consejo dermatológico profesional."
            : "This tool is intended only for cosmetic awareness purposes. Results are not a substitute for professional dermatological advice."}
        </p>
      </div>
    `;

    // Send email via Resend
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "HL/Skin <noreply@hlskin.ai>",
      to: email,
      subject: isSpanish ? "Tu Análisis de Piel - HL/Skin" : "Your Skin Analysis - HL/Skin",
      html,
    });

    return NextResponse.json({ status: "success", message: "Report sent" });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: error.message || "Failed to send report" }, { status: 500 });
  }
}
