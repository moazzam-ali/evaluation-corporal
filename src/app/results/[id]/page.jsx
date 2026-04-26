"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";

import useAnalysisStore from "@/store/analysisStore";
import { INSIGHT_CATEGORIES } from "@/lib/metric-icons";
import Loader from "@/components/Loader/Loader";
import ScorePanel from "@/components/ScorePanel/ScorePanel";
import ScoreCircle from "@/components/ScoreCircle/ScoreCircle";
import ProductCard from "@/components/ProductCard/ProductCard";

/* Section header helper */
function SectionHead({ eyebrow, title, titleEm, lede }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div
        className="inline-flex items-center gap-2.5 mb-3"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6B6B7A" }}
      >
        <span style={{ width: "24px", height: "1px", background: "#E8728A" }} />
        {eyebrow}
      </div>
      <h2 style={{
        fontFamily: "var(--font-cormorant)", fontWeight: 300,
        fontSize: "clamp(30px, 3.5vw, 42px)", color: "#1A1A2E",
        margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em",
      }}>
        {title} <em style={{ fontStyle: "italic", color: "#E8728A", fontWeight: 400 }}>{titleEm}</em>
      </h2>
      {lede && (
        <p style={{ margin: "12px 0 0", fontSize: "15px", color: "#6B6B7A", maxWidth: "60ch", lineHeight: 1.6 }}>
          {lede}
        </p>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const {
    fetchAnalysis, isLoading, error,
    overallScore, skinType, metrics, enrichedProducts,
    summary, insights, tips, routineNote, imageUrl, formData,
  } = useAnalysisStore();

  useEffect(() => {
    const hasData = useAnalysisStore.getState().metrics.length > 0;
    if (!hasData && id) fetchAnalysis(id);
  }, [id, fetchAnalysis]);

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p style={{ fontSize: "18px", color: "#C7344E", marginBottom: "16px" }}>{t("common.error")}</p>
        <p style={{ fontSize: "14px", color: "#6B6B7A", marginBottom: "24px" }}>{error}</p>
        <Link href="/scan" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
          padding: "11px 20px", borderRadius: "999px",
          border: "1.5px solid rgba(26,26,46,0.16)", background: "transparent", color: "#1A1A2E",
        }}>
          {t("common.back", "Go back")}
        </Link>
      </div>
    );
  }

  const products = enrichedProducts || [];
  const userName = formData?.name || "";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto" style={{ maxWidth: "1100px", padding: "56px 32px 96px" }}>
      {/* ===== HEADER STRIP (clinical variant) ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "56px" }}>
        <div
          className="inline-flex items-center gap-3 mb-4"
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6B6B7A" }}
        >
          <span style={{ width: "28px", height: "1px", background: "#E8728A" }} />
          {t("results.clinical_eyebrow", "Clinical Report")}
        </div>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontWeight: 300,
          fontSize: "clamp(40px, 5.5vw, 60px)", color: "#1A1A2E",
          margin: 0, lineHeight: 1.05, letterSpacing: "-0.01em",
        }}>
          {t("results.clinical_title", "Skin assessment")}{" "}
          {userName && <em style={{ fontStyle: "italic", color: "#E8728A", fontWeight: 400 }}>{t("results.clinical_for", "for")} {userName}.</em>}
        </h1>
        <div
          className="flex items-center gap-4 flex-wrap mt-4"
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", color: "#6B6B7A" }}
        >
          <span>{dateStr}</span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(26,26,46,0.16)" }} />
          <span>{metrics.length} {t("results.metrics_analysed", "metrics analysed")}</span>
        </div>
      </motion.div>

      {/* ===== HERO: PHOTO + SCORE + SUMMARY ===== */}
      <div style={{ marginBottom: "80px" }}>
        <ScorePanel overallScore={overallScore} skinType={skinType} summary={summary} imageUrl={imageUrl} />
      </div>

      {/* ===== 12 METRICS ===== */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginTop: "80px" }}>
        <SectionHead
          eyebrow={t("results.metrics_eyebrow", "Detailed metrics")}
          title={t("results.metrics_title_1", "Twelve readings,")}
          titleEm={t("results.metrics_title_2", "one face.")}
          lede={t("results.metrics_lede", "Each metric is scored 0–100 against your demographic cohort. Tap a card for the full description.")}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {metrics.map((metric, i) => (
            <ScoreCircle
              key={metric.id}
              metricId={metric.id}
              score={metric.score}
              status={metric.status}
              label={t(`metrics.${metric.id}`, metric.id)}
              insight={metric.insight}
              description={t(`metrics_desc.${metric.id}`, "")}
              delay={i * 0.04}
            />
          ))}
        </div>
        <style jsx>{`
          @media (max-width: 1000px) { div[style*="repeat(4"] { grid-template-columns: repeat(3, 1fr) !important; } }
          @media (max-width: 760px) { div[style*="repeat(4"], div[style*="repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; } }
        `}</style>
      </motion.section>

      {/* ===== INSIGHTS ===== */}
      {insights.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: "80px" }}>
          <SectionHead
            eyebrow={t("results.insights_eyebrow", "In-depth analysis")}
            title={t("results.insights_title_1", "What the numbers")}
            titleEm={t("results.insights_title_2", "mean for you.")}
            lede={t("results.insights_lede", "Four lenses on the same data — what's working, what's stressed, what your habits are doing to it, and where to aim next.")}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {insights.map((insight, i) => {
              const config = INSIGHT_CATEGORIES[insight.category];
              if (!config) return null;
              const CategoryIcon = config.icon;
              const colorMap = { strengths: "#5B9A8B", concerns: "#E8728A", lifestyle: "#D4A053", goals: "#1A1A2E" };
              const washMap = { strengths: "#E6F1ED", concerns: "#FDEEF1", lifestyle: "#FAF1DE", goals: "#F0F0F4" };
              const clr = colorMap[insight.category] || "#1A1A2E";
              const wash = washMap[insight.category] || "#F0F0F4";

              return (
                <motion.article
                  key={insight.category}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="relative overflow-hidden"
                  style={{
                    background: "white", border: "1px solid rgba(26,26,46,0.10)",
                    borderRadius: "18px", padding: "24px 24px 22px",
                  }}
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0" style={{ width: "4px", background: clr }} />

                  <div className="flex items-center gap-3 mb-3.5">
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      style={{ width: "36px", height: "36px", borderRadius: "10px", background: wash, color: clr }}
                    >
                      <CategoryIcon style={{ width: "18px", height: "18px" }} />
                    </span>
                    <h3 style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "22px", margin: 0, color: "#1A1A2E", lineHeight: 1.2 }}>
                      {insight.title}
                    </h3>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {insight.points.map((point, j) => (
                      <li key={j} className="flex gap-3" style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#2D2D40" }}>
                        <span className="mt-2 shrink-0" style={{ width: "6px", height: "6px", borderRadius: "50%", background: clr }} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              );
            })}
          </div>
          <style jsx>{`
            @media (max-width: 720px) { div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; } }
          `}</style>
        </motion.section>
      )}

      {/* ===== TIPS + ROUTINE ===== */}
      {(tips.length > 0 || routineNote) && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: "80px" }}>
          <SectionHead
            eyebrow={t("results.tips_eyebrow", "For you · This month")}
            title={t("results.tips_title_1", "Five tips,")}
            titleEm={t("results.tips_title_2", "one routine.")}
            lede={t("results.tips_lede", "Small adjustments, sequenced. The routine is built around your concerns — order, frequency, and timing all included.")}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {/* Tips card */}
            {tips.length > 0 && (
              <div style={{ background: "white", border: "1px solid rgba(26,26,46,0.10)", borderRadius: "18px", padding: "24px 24px 22px" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center shrink-0" style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FAF1DE", color: "#D4A053" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                  </span>
                  <h3 style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "22px", margin: 0, color: "#1A1A2E" }}>
                    {t("results.tips_title", "Personalised tips")}
                  </h3>
                </div>
                <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tips.map((tip, i) => (
                    <li key={i} className="flex gap-3" style={{ fontSize: "13.5px", lineHeight: 1.55, color: "#2D2D40" }}>
                      <span
                        className="inline-flex items-center justify-center shrink-0"
                        style={{
                          width: "22px", height: "22px", borderRadius: "999px",
                          background: "#FAF1DE", color: "#D4A053",
                          fontFamily: "var(--font-dm-sans)", fontSize: "11px", fontWeight: 700,
                          marginTop: "1px",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Routine card */}
            {routineNote && (
              <div style={{
                background: "linear-gradient(160deg, #FDF8F3 0%, #FDEEF1 100%)",
                border: "1px solid rgba(232,114,138,0.25)",
                borderRadius: "18px", padding: "24px 24px 22px",
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center shrink-0" style={{ width: "36px", height: "36px", borderRadius: "10px", background: "white", color: "#E8728A" }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  <h3 style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "22px", margin: 0, color: "#1A1A2E" }}>
                    {t("results.routine_title", "Your routine")}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "#2D2D40" }}>
                  {routineNote}
                </p>
              </div>
            )}
          </div>
          <style jsx>{`
            @media (max-width: 720px) { div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; } }
          `}</style>
        </motion.section>
      )}

      {/* ===== PRODUCTS ===== */}
      {products.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ marginTop: "80px" }}>
          <SectionHead
            eyebrow={t("results.products_eyebrow", "Recommended products")}
            title={t("results.products_title_1", "Curated for")}
            titleEm={t("results.products_title_2", "your readings.")}
            lede={t("results.products_lede", "Personalised for your skin analysis — picks ranked by how directly they target your lowest-scoring metrics.")}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={0.7 + i * 0.1} />
            ))}
          </div>
          <style jsx>{`
            @media (max-width: 1000px) { div[style*="repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 600px) { div[style*="repeat(3"], div[style*="repeat(2"] { grid-template-columns: 1fr !important; } }
          `}</style>
        </motion.section>
      )}

      {/* ===== ACTIONS (simplified — only "Run a new scan") ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center"
        style={{ marginTop: "60px", paddingTop: "32px", borderTop: "1px solid rgba(26,26,46,0.10)" }}
      >
        <Link
          href="/scan"
          className="inline-flex items-center justify-center gap-2"
          style={{
            fontFamily: "var(--font-dm-sans)", fontSize: "14px", fontWeight: 500,
            padding: "13px 24px", borderRadius: "999px",
            background: "#E8728A", color: "white", textDecoration: "none",
            transition: "transform 180ms, box-shadow 320ms, background 180ms",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9c2.5 0 4.7 1 6.4 2.6L21 8"/><path d="M21 3v5h-5"/></svg>
          {t("results.new_scan", "Run a new scan")}
        </Link>
      </motion.div>

      {/* ===== FOOTNOTE ===== */}
      <p style={{
        marginTop: "48px", textAlign: "center",
        fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#6B6B7A",
        letterSpacing: "0.04em", maxWidth: "56ch", marginInline: "auto", lineHeight: 1.6,
      }}>
        {t("results.footnote", "This tool is intended only for cosmetic awareness purposes. Skin scores may vary based on applied makeup. Results are not a substitute for professional dermatological advice.")}
      </p>
    </div>
  );
}
