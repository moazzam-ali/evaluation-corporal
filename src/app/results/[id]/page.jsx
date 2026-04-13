"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Lightbulb, CalendarClock, BookOpen } from "lucide-react";

import useAnalysisStore from "@/store/analysisStore";
import { getProductsForRecommendations } from "@/lib/products";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader/Loader";
import ScorePanel from "@/components/ScorePanel/ScorePanel";
import ScoreCircle from "@/components/ScoreCircle/ScoreCircle";
import ProductCard from "@/components/ProductCard/ProductCard";

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
    detailedAnalysis,
    tips,
    routineNote,
    imageUrl,
  } = useAnalysisStore();

  useEffect(() => {
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight">{t("results.title")}</h1>
      </motion.div>

      {/* Score Panel with photo */}
      <div className="mb-10">
        <ScorePanel
          overallScore={overallScore}
          skinType={skinType}
          summary={summary}
          imageUrl={imageUrl}
        />
      </div>

      <hr className="mb-10 border-border/50" />

      {/* Metric Circles Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <h2 className="mb-6 text-xl font-bold">{t("results.metrics_title")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <ScoreCircle
              key={metric.id}
              score={metric.score}
              status={metric.status}
              label={t(`metrics.${metric.id}`, metric.id)}
              insight={metric.insight}
              description={t(`metrics_desc.${metric.id}`, "")}
              delay={i * 0.06}
            />
          ))}
        </div>
      </motion.div>

      {/* Detailed Analysis Section */}
      {(detailedAnalysis || tips.length > 0 || routineNote) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10 space-y-6"
        >
          {/* Detailed Analysis */}
          {detailedAnalysis && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">{t("results.analysis_title", "In-Depth Analysis")}</h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {detailedAnalysis.split("\n").filter(Boolean).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Tips + Routine in two columns */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tips */}
            {tips.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[#D4A053]" />
                  <h3 className="text-base font-bold">{t("results.tips_title", "Personalised Tips")}</h3>
                </div>
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4A053]/10 text-[10px] font-bold text-[#D4A053]">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Routine Note */}
            {routineNote && (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-secondary" />
                  <h3 className="text-base font-bold">{t("results.routine_title", "Your Routine")}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{routineNote}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Product Recommendations */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold">{t("results.recommendations_title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("results.recommendations_subtitle", "Personalised for your skin analysis")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delay={0.6 + i * 0.1} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <Link href="/scan">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("results.new_scan")}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
