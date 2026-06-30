"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import StageStrip from "@/components/StageStrip/StageStrip";
import { Card } from "@/components/results/ResultsCharts";
import { ATLAS_VIEWS, ATLAS_SEXES, ATLAS_COLLECTIONS } from "@/data/visual-atlas";

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 text-[13px] font-medium transition-all"
      style={{
        fontFamily: "var(--font-inter)",
        background: active ? "var(--ink)" : "white",
        color: active ? "white" : "var(--muted-fg)",
        border: active ? "1px solid var(--ink)" : "1px solid var(--border-hex, #E4D9C6)",
      }}
    >
      {children}
    </button>
  );
}

export default function VisualAtlasPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [view, setView] = useState("external");
  const [sex, setSex] = useState("male");

  const collections = ATLAS_COLLECTIONS.filter((c) => c.view === view && c.sex === sex);

  return (
    <div className="min-h-screen" style={{ background: "#F4EFE7", fontFamily: "var(--font-inter)" }}>
      {/* Header + controls */}
      <section className="relative" style={{ padding: "28px 20px 8px" }}>
        <div className="max-w-[1100px] mx-auto">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors hover:text-[var(--ink)]"
            style={{ color: "var(--muted-fg)", fontFamily: "var(--font-inter)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {t("atlas.back", "Back to results")}
          </button>

          <div className="text-center mt-8 max-w-[720px] mx-auto">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--primary-hex, #9B8573)" }}>
              {t("atlas.eyebrow", "Visual guide")}
            </div>
            <h1 className="mt-3 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
              {t("atlas.title", "See it, understand it.")}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {t("atlas.subtitle", "A visual library for walking through results — switch the lens and tap any figure to enlarge it.")}
            </p>
          </div>

          {/* Selectors */}
          <div className="flex flex-col items-center gap-3 mt-9">
            <div className="flex flex-wrap justify-center gap-2">
              {ATLAS_VIEWS.map((v) => (
                <Chip key={v.id} active={view === v.id} onClick={() => setView(v.id)}>{t(v.labelKey, v.labelEn)}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {ATLAS_SEXES.map((s) => (
                <Chip key={s.id} active={sex === s.id} onClick={() => setSex(s.id)}>{t(s.labelKey, s.labelEn)}</Chip>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="pb-24 pt-8">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 flex flex-col gap-4">
          {collections.length === 0 ? (
            <div className="text-center py-20 text-[14px]" style={{ color: "var(--muted-fg)" }}>
              {t("atlas.empty", "No visuals for this combination yet.")}
            </div>
          ) : (
            collections.map((c) => (
              <Card key={c.id}>
                <StageStrip
                  trueColor
                  label={t(c.titleKey, c.titleEn)}
                  caption={t(c.captionKey, c.captionEn)}
                  stages={c.stages.map((s) => ({
                    key: s.key,
                    label: t(s.labelKey, s.labelEn),
                    sub: s.sub,
                    img: s.img,
                    scaleX: s.scaleX,
                  }))}
                />
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
