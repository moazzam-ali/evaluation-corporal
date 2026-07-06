"use client";

import { useState } from "react";

/**
 * MeasurementGuide — an illustrated helper that shows how to take the waist
 * and hip measurements used for the waist-to-hip ratio. Built around real
 * reference photos (one per body type) with the tape positions marked, plus
 * step-by-step callouts and technique tips. The photo follows the sex chosen
 * in the form and can be switched manually.
 */

// Tape-band positions as a % of the image height (per body type).
const MARKS = {
  male: { waist: 41, hip: 51.5 },
  female: { waist: 40, hip: 52.5 },
};

// The parent passes key={sex} so a change in the form's sex selection
// remounts the guide with the matching photo preselected.
export default function MeasurementGuide({ t, sex = "male" }) {
  const [view, setView] = useState(sex === "female" ? "female" : "male");
  const marks = MARKS[view];

  const items = [
    { n: 1, label: t("measure.waist_label", "Waist"), desc: t("measure.waist_desc", "Measure around the narrowest part of your abdomen, without pulling the tape tight.") },
    { n: 2, label: t("measure.hip_label", "Hip"), desc: t("measure.hip_desc", "Measure around the widest part of your hips and glutes.") },
  ];

  const tips = [
    t("measure.tip", "Keep the tape level and parallel to the floor."),
    t("measure.tip_snug", "The tape should sit snug against the skin — never compressing it."),
    t("measure.tip_exhale", "Measure at the end of a normal exhale, standing relaxed."),
    t("measure.tip_skin", "Measure on bare skin or over thin clothing for accuracy."),
  ];

  const sexOptions = [
    { id: "male", label: t("measure.body_male", "Male") },
    { id: "female", label: t("measure.body_female", "Female") },
  ];

  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: "rgba(47,47,43,0.10)", background: "#FBF9F5" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--primary-hex, #9B8573)", fontFamily: "var(--font-inter)" }}>
          {t("measure.title", "How to take your measurements")}
        </div>
        {/* Body toggle — preselected from the form, switchable */}
        <div className="flex gap-1 rounded-full p-1" style={{ background: "rgba(47,47,43,0.05)", border: "1px solid rgba(47,47,43,0.08)" }}>
          {sexOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setView(opt.id)}
              className="rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
              style={{
                fontFamily: "var(--font-inter)",
                background: view === opt.id ? "#9B8573" : "transparent",
                color: view === opt.id ? "white" : "#6B5B4B",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
        {/* Reference photo with the waist + hip tape bands marked */}
        <div className="relative shrink-0 w-[200px] sm:w-[220px]">
          <img
            src={`/measure/${view}-tape.webp`}
            alt={t("measure.title", "How to take your measurements")}
            className="w-full h-auto select-none"
            draggable={false}
          />
          {[{ n: 1, top: marks.waist }, { n: 2, top: marks.hip }].map((m) => (
            <div key={m.n} className="absolute left-0 right-0 flex items-center" style={{ top: `${m.top}%`, transform: "translateY(-50%)" }}>
              {/* dashed guide line pointing at the tape band */}
              <span aria-hidden className="absolute left-3 right-3" style={{ borderTop: "2px dashed rgba(155,133,115,0.45)" }} />
              <span
                className="relative flex items-center justify-center rounded-full text-white text-[12px] font-bold"
                style={{
                  width: 24, height: 24, marginLeft: 2,
                  background: "#9B8573", boxShadow: "0 0 0 3px rgba(251,249,245,0.9)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {m.n}
              </span>
            </div>
          ))}
        </div>

        {/* Callouts */}
        <div className="flex flex-col gap-3.5 flex-1 w-full">
          {items.map((it) => (
            <div key={it.n} className="flex gap-3">
              <span className="shrink-0 flex items-center justify-center rounded-full text-white text-[12px] font-bold" style={{ width: 24, height: 24, background: "#9B8573", fontFamily: "var(--font-inter)" }}>{it.n}</span>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--ink, #2F2F2B)", fontFamily: "var(--font-inter)" }}>{it.label}</div>
                <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: "#6B5B4B", fontFamily: "var(--font-inter)" }}>{it.desc}</p>
              </div>
            </div>
          ))}

          {/* Technique tips */}
          <div className="flex flex-col gap-2.5 mt-1.5 pt-3.5" style={{ borderTop: "1px dashed rgba(47,47,43,0.12)" }}>
            {tips.map((tip) => (
              <div key={tip} className="flex items-start gap-2.5">
                <span className="shrink-0 flex items-center justify-center rounded-full mt-px" style={{ width: 18, height: 18, background: "#9B8573" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-[12.5px] leading-relaxed" style={{ color: "#6B5B4B", fontFamily: "var(--font-inter)" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
