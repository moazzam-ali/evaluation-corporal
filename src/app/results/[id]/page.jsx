"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

import useAnalysisStore from "@/store/analysisStore";
import { getProductsForRecommendations } from "@/lib/products";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader/Loader";
import ScorePanel from "@/components/ScorePanel/ScorePanel";
import ScoreCircle from "@/components/ScoreCircle/ScoreCircle";
import ProductCard from "@/components/ProductCard/ProductCard";
import EmailCapture from "@/components/EmailCapture/EmailCapture";

export default function ResultsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const {
    fetchAnalysis,
    isLoading,
    error,
    overallScore,
    skinType,
    metrics,
    recommendations,
    summary,
  } = useAnalysisStore();

  useEffect(() => {
    // If the store already has data (navigated from scan page), skip the API call
    const hasData = useAnalysisStore.getState().metrics.length > 0;
    if (!hasData && id) {
      fetchAnalysis(id);
    }
  }, [id, fetchAnalysis]);

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-4 text-lg text-destructive">{t("common.error")}</p>
        <p className="mb-6 text-sm text-muted-foreground">{error}</p>
        <Link href="/scan">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const products = getProductsForRecommendations(recommendations);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold">{t("results.title")}</h1>
      </motion.div>

      {/* Overall Score Panel */}
      <div className="mb-10">
        <ScorePanel
          overallScore={overallScore}
          skinType={skinType}
          summary={summary}
        />
      </div>

      {/* Metric Circles Grid */}
      <div className="mb-10">
        <h2 className="mb-6 text-xl font-bold">{t("results.metrics_title")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <ScoreCircle
              key={metric.id}
              score={metric.score}
              status={metric.status}
              label={t(`metrics.${metric.id}`, metric.id)}
              insight={metric.insight}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>

      {/* Email Capture */}
      <div className="mb-10">
        <EmailCapture analysisId={id} />
      </div>

      {/* Product Recommendations */}
      {products.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-6 text-xl font-bold">{t("results.recommendations_title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={i * 0.1} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/scan">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("results.new_scan")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
