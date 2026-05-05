"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Image from "next/image";

export default function ScorePanel({ overallScore, skinType, summary, imageUrl }) {
  const { t } = useTranslation();

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallScore / 100) * circumference;
  const color = overallScore >= 80 ? "#5B9A8B" : overallScore >= 40 ? "#D4A053" : "#E8728A";
  const statusText = overallScore >= 80
    ? t("results.score_good", "Skin in good balance overall")
    : overallScore >= 40
      ? t("results.score_normal", "Some areas need attention")
      : t("results.score_alert", "Several areas need care");

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr]"
      style={{
        background: "white",
        border: "1px solid rgba(26,26,46,0.10)",
        borderRadius: "24px",
        boxShadow: "0 1px 2px rgba(26,26,46,0.04)",
      }}
    >
      {/* Photo column */}
      <div
        className="relative flex items-center justify-center"
        style={{
          background: "linear-gradient(160deg, #FDEEF1 0%, #F9D1D9 100%)",
          padding: "32px",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: "100%", maxWidth: "256px", aspectRatio: "1",
            borderRadius: "20px", border: "3px solid white",
            boxShadow: "0 12px 32px rgba(26,26,46,0.16)",
            background: "linear-gradient(160deg, #F8C8D2 0%, #E89BAB 60%, #D67285 100%)",
          }}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={t("results.photo_alt", "Skin scan")} fill className="object-cover" sizes="256px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg viewBox="0 0 256 256" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                <ellipse cx="128" cy="140" rx="78" ry="100" fill="#E89BAB" opacity="0.92"/>
                <ellipse cx="105" cy="118" rx="5" ry="3" fill="#1A1A2E" opacity="0.75"/>
                <ellipse cx="151" cy="118" rx="5" ry="3" fill="#1A1A2E" opacity="0.75"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Score info column */}
      <div className="flex flex-col gap-6 p-6 md:p-9">
        <div className="flex flex-col items-center md:flex-row md:items-center gap-6 md:gap-7">
          {/* Score ring + label below */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative" style={{ width: "132px", height: "132px" }}>
              <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="66" cy="66" r={radius} fill="none" stroke="#EDE3DA" strokeWidth="8" />
                <motion.circle
                  cx="66" cy="66" r={radius}
                  fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.strong
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "38px", color, lineHeight: 1 }}
                >
                  {overallScore}<span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "16px", color, marginLeft: "2px" }}>%</span>
                </motion.strong>
              </div>
            </div>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B7A", marginTop: "8px" }}>
              {t("results.overall_score", "Overall Score")}
            </span>
          </div>

          {/* Score info */}
          <div className="flex flex-col items-center md:items-start gap-3.5 min-w-0">
            <span
              className="inline-flex items-center gap-2 self-start"
              style={{
                background: "#E6F1ED", color: "#5B9A8B",
                padding: "6px 14px", borderRadius: "999px",
                fontFamily: "var(--font-dm-sans)", fontSize: "12px", fontWeight: 500,
              }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {statusText}
            </span>

            <div style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "28px", color: "#1A1A2E", lineHeight: 1.15 }}>
              {t("results.skin_type", "Skin type")} — <em style={{ fontStyle: "italic", color: "#E8728A" }}>{t(`scan.skin_types.${skinType}`, skinType)}</em>
            </div>

            <div className="flex gap-4 flex-wrap">
              {[
                { cls: "good", color: "#5B9A8B", label: `${t("results.score_guide.good", "Good")} · 80–100` },
                { cls: "normal", color: "#D4A053", label: `${t("results.score_guide.normal", "Normal")} · 40–79` },
                { cls: "alert", color: "#E8728A", label: `${t("results.score_guide.needs_attention", "Needs attention")} · 0–39` },
              ].map((l) => (
                <span key={l.cls} className="inline-flex items-center gap-2 whitespace-nowrap" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#6B6B7A" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <p
            style={{
              borderTop: "1px solid rgba(26,26,46,0.10)", paddingTop: "22px",
              fontFamily: "var(--font-inter)", fontSize: "15px", color: "#1A1A2E",
              lineHeight: 1.65, margin: 0,
            }}
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        )}
      </div>

    </motion.section>
  );
}
