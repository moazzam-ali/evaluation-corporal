"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const STATUS_STROKES = {
  good: "#8D9A84",
  normal: "#C7A977",
  needs_attention: "#9B8573",
};

export default function ScoreCircle({ metricId, score, status, label, insight, description, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const stroke = STATUS_STROKES[status] || STATUS_STROKES.normal;
  const statusLabel = t(`results.status.${status}`, status);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center text-center cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "white",
        border: expanded ? `1.5px solid ${stroke}` : "1px solid rgba(47,47,43,0.10)",
        borderRadius: "16px",
        padding: "22px 18px 20px",
        transition: "transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms, border-color 220ms",
      }}
      whileHover={{ y: -2, boxShadow: "0 12px 28px rgba(47,47,43,0.08)" }}
    >
      {/* Ring — ring-only variant (no icon) */}
      <div className="relative mb-3" style={{ width: "80px", height: "80px" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#E4D9C6" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r={radius}
            fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontSize: "22px", color: stroke, lineHeight: 1 }}
          >
            {score}
          </motion.span>
        </div>
      </div>

      {/* Label */}
      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500, color: "#2F2F2B", marginBottom: "4px", lineHeight: 1.3 }}>
        {label}
      </div>

      {/* Insight */}
      {insight && (
        <div style={{ fontFamily: "var(--font-inter)", fontSize: "11.5px", color: "#6B5B4B", lineHeight: 1.45 }}>
          {insight}
        </div>
      )}

      {/* Status dot */}
      <div
        className="inline-flex items-center gap-1.5 mt-2.5"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B5B4B" }}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: stroke }} />
        {statusLabel}
      </div>

      {/* Expand indicator */}
      {description && (
        <div
          className="inline-flex items-center gap-1 mt-2"
          style={{
            fontFamily: "var(--font-dm-sans)", fontSize: "10px", fontWeight: 500,
            color: expanded ? stroke : "rgba(47,47,43,0.30)",
            transition: "color 180ms",
          }}
        >
          <svg
            viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {expanded ? t("results.metric_less", "Less") : t("results.metric_details", "Details")}
        </div>
      )}

      {/* Expanded description */}
      <AnimatePresence>
        {expanded && description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden w-full"
          >
            <p style={{
              marginTop: "12px", paddingTop: "12px",
              borderTop: "1px solid rgba(47,47,43,0.10)",
              fontFamily: "var(--font-inter)", fontSize: "12px", color: "#6B5B4B",
              lineHeight: 1.55, textAlign: "center",
            }}>
              {description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
