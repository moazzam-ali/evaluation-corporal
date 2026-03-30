"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

function getStatusColor(status) {
  switch (status) {
    case "good":
      return "#22c55e";
    case "normal":
      return "#f59e0b";
    case "needs_attention":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export default function ScorePanel({ overallScore, skinType, summary }) {
  const { t } = useTranslation();

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallScore / 100) * circumference;
  const color = overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-2xl border bg-card p-8 shadow-sm"
    >
      {/* Overall score circle */}
      <div className="relative mb-6">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            {overallScore}%
          </motion.span>
          <span className="text-xs text-muted-foreground">
            {t("results.overall_score")}
          </span>
        </div>
      </div>

      {/* Skin type */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
        <span className="text-sm font-medium text-primary">
          {t("results.skin_type")}: {t(`scan.skin_types.${skinType}`, skinType)}
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-center text-sm text-muted-foreground">{summary}</p>
      )}
    </motion.div>
  );
}
