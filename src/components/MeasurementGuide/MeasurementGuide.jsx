"use client";

/**
 * MeasurementGuide — a small illustrated helper that shows how to take the
 * waist and hip measurements used for the waist-to-hip ratio. Pure SVG + text
 * so every label localizes (t) and stays crisp at any size.
 */

const FRONT_PATH =
  "M100 20 C 88 20 80 30 80 44 C 80 56 86 64 92 68 L 88 76 C 70 80 56 90 54 110 L 50 150 C 48 162 50 174 56 184 L 60 200 L 56 240 C 56 250 60 258 64 264 L 60 320 C 60 332 64 344 70 354 L 76 366 L 90 366 L 92 354 L 90 320 L 92 270 L 100 270 L 108 270 L 110 320 L 108 354 L 110 366 L 124 366 L 130 354 C 136 344 140 332 140 320 L 136 264 C 140 258 144 250 144 240 L 140 200 L 144 184 C 150 174 152 162 150 150 L 146 110 C 144 90 130 80 112 76 L 108 68 C 114 64 120 56 120 44 C 120 30 112 20 100 20 Z";

export default function MeasurementGuide({ t }) {
  const items = [
    { n: 1, label: t("measure.waist_label", "Waist"), desc: t("measure.waist_desc", "Measure around the narrowest part of your abdomen, without pulling the tape tight.") },
    { n: 2, label: t("measure.hip_label", "Hip"), desc: t("measure.hip_desc", "Measure around the widest part of your hips and glutes.") },
  ];

  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: "rgba(47,47,43,0.10)", background: "#FBF9F5" }}>
      <div className="text-center text-[12px] font-bold uppercase tracking-[0.16em] mb-5" style={{ color: "var(--primary-hex, #9B8573)", fontFamily: "var(--font-inter)" }}>
        {t("measure.title", "How to take your measurements")}
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
        {/* Figure with waist + hip tape bands */}
        <svg viewBox="0 0 200 380" className="w-[116px] sm:w-[132px] h-auto shrink-0" role="img" aria-label={t("measure.title", "How to take your measurements")}>
          <path d={FRONT_PATH} fill="#E7D8C4" stroke="#C7A977" strokeWidth="1.2" />
          {/* Waist band (1) */}
          <ellipse cx="100" cy="190" rx="45" ry="6" fill="none" stroke="#9B8573" strokeWidth="2.5" strokeDasharray="3 3" />
          <circle cx="55" cy="190" r="10" fill="#9B8573" />
          <text x="55" y="190" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="700" fontFamily="var(--font-inter)">1</text>
          {/* Hip band (2) */}
          <ellipse cx="100" cy="242" rx="48" ry="7" fill="none" stroke="#9B8573" strokeWidth="2.5" strokeDasharray="3 3" />
          <circle cx="52" cy="242" r="10" fill="#9B8573" />
          <text x="52" y="242" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="700" fontFamily="var(--font-inter)">2</text>
        </svg>

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
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2.5 mt-5 pt-4" style={{ borderTop: "1px dashed rgba(47,47,43,0.12)" }}>
        <span className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: "#9B8573" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
        </span>
        <span className="text-[12.5px]" style={{ color: "#6B5B4B", fontFamily: "var(--font-inter)" }}>{t("measure.tip", "Keep the tape level and parallel to the floor.")}</span>
      </div>
    </div>
  );
}
