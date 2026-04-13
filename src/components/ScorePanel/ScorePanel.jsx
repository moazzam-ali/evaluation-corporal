"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Camera } from "lucide-react";

function getStatusColor(status) {
  switch (status) {
    case "good":
      return "#5B9A8B";
    case "normal":
      return "#D4A053";
    case "needs_attention":
      return "#E8728A";
    default:
      return "#8E8A9B";
  }
}

export default function ScorePanel({ overallScore, skinType, summary, imageUrl }) {
  const { t } = useTranslation();

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallScore / 100) * circumference;
  const color = overallScore >= 80 ? "#5B9A8B" : overallScore >= 40 ? "#D4A053" : "#E8728A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      {/* Two-column layout: photo + score */}
      <div className="flex flex-col md:flex-row">
        {/* Left: Scanned photo */}
        <div className="relative flex items-center justify-center bg-gradient-to-br from-muted/50 to-accent/5 p-6 md:w-64 md:shrink-0">
          <div className="relative h-48 w-48 overflow-hidden rounded-2xl border-2 border-border/50 shadow-lg md:h-52 md:w-52">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Skin scan"
                fill
                className="object-cover"
                sizes="208px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/30">
                <Camera className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Score + summary */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 md:items-start md:p-8">
          {/* Score circle + skin type inline */}
          <div className="flex items-center gap-6">
            {/* Compact score circle */}
            <div className="relative shrink-0">
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="hsl(340, 15%, 90%)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
                  transform="rotate(-90 65 65)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold"
                  style={{ color }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  {overallScore}%
                </motion.span>
                <span className="text-[10px] text-muted-foreground">
                  {t("results.overall_score")}
                </span>
              </div>
            </div>

            {/* Skin type + score guide */}
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 self-start">
                <span className="text-xs font-medium text-primary">
                  {t("results.skin_type")}: {t(`scan.skin_types.${skinType}`, skinType)}
                </span>
              </div>

              {/* Score guide legend */}
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#5B9A8B]" />
                  <span className="text-muted-foreground">{t("results.score_guide.good", "Good")}: 80–100</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#D4A053]" />
                  <span className="text-muted-foreground">{t("results.score_guide.normal", "Normal")}: 40–79</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#E8728A]" />
                  <span className="text-muted-foreground">{t("results.score_guide.needs_attention", "Needs Attention")}: 0–39</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-left">
              {summary}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
