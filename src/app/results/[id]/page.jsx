"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import useAnalysisStore from "@/store/analysisStore";
import Loader from "@/components/Loader/Loader";
import BodyResultsTemplate from "@/components/results/BodyResultsTemplate";
import { mapResultsToView } from "@/lib/map-results-to-view";

export default function ResultsPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const {
    fetchAnalysis, reEnrichProducts, isLoading, error,
    analysisData, metrics, enrichedProducts,
    insights, tips, summary, formData,
  } = useAnalysisStore();

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const hasData = useAnalysisStore.getState().metrics.length > 0;
    if (!hasData && id) fetchAnalysis(id);
  }, [id, fetchAnalysis]);

  // Re-enrich products when user switches language
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }
    if (id) reEnrichProducts(id, i18n.language);
  }, [i18n.language, id, reEnrichProducts]);

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p style={{ fontSize: "18px", color: "#9C5A4A", marginBottom: "16px" }}>{t("common.error")}</p>
        <p style={{ fontSize: "14px", color: "#6B5B4B", marginBottom: "24px" }}>{error}</p>
        <Link href="/scan" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500,
          padding: "11px 20px", borderRadius: "999px",
          border: "1.5px solid rgba(47,47,43,0.16)", background: "transparent", color: "#2F2F2B",
        }}>
          {t("common.back", "Go back")}
        </Link>
      </div>
    );
  }

  const results = analysisData?.results;
  if (!results || !formData) return <Loader />;

  const viewData = mapResultsToView({ formData, results });

  return (
    <BodyResultsTemplate
      data={viewData}
      products={enrichedProducts || []}
      insights={insights}
      tips={tips}
      summary={summary}
      metrics={metrics}
      createdAt={analysisData?.createdAt}
      imageUrl={analysisData?.imageUrl || null}
      bodyType={results.body_type || null}
      postureNote={results.posture_note || null}
      compositionNote={results.composition_note || null}
      photoQualityNote={results.photo_quality_note || null}
      visionAvailable={!!results.vision_available}
    />
  );
}
