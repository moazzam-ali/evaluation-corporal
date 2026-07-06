"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLightbox, ExpandIcon } from "@/components/Lightbox/Lightbox";

/**
 * StageStrip — an integrated "spectrum" filmstrip that shows how a body
 * looks across the stages of a banded metric (body fat, BMI, WHR …) and
 * highlights the stage the user currently sits in.
 *
 * Each figure is clickable: it opens a near-fullscreen gallery (the whole
 * spectrum enlarged, current stage flagged) so a coach can walk a client
 * through the visuals in detail.
 */

// Brand front-view silhouette (shared with the landing hero visual).
const FRONT_PATH =
  "M100 20 C 88 20 80 30 80 44 C 80 56 86 64 92 68 L 88 76 C 70 80 56 90 54 110 L 50 150 C 48 162 50 174 56 184 L 60 200 L 56 240 C 56 250 60 258 64 264 L 60 320 C 60 332 64 344 70 354 L 76 366 L 90 366 L 92 354 L 90 320 L 92 270 L 100 270 L 108 270 L 110 320 L 108 354 L 110 366 L 124 366 L 130 354 C 136 344 140 332 140 320 L 136 264 C 140 258 144 250 144 240 L 140 200 L 144 184 C 150 174 152 162 150 150 L 146 110 C 144 90 130 80 112 76 L 108 68 C 114 64 120 56 120 44 C 120 30 112 20 100 20 Z";

function Silhouette({ scaleX = 1, color }) {
  return (
    <svg viewBox="0 0 200 380" className="w-full h-full" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <g transform={`translate(100 0) scale(${scaleX} 1) translate(-100 0)`}>
        <path d={FRONT_PATH} fill={color} />
      </g>
    </svg>
  );
}

function StageFigure({ stage, active, onOpen, trueColor }) {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = stage.img && !imgFailed;
  const clickable = !!onOpen && showImg;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`group relative w-full overflow-hidden ${clickable ? "cursor-zoom-in" : ""}`}
        style={{
          aspectRatio: "3 / 4",
          borderRadius: 12,
          background: active
            ? "linear-gradient(180deg, #FFFFFF 0%, #F5EBD5 100%)"
            : "#F8F6F2",
          border: active ? "1.5px solid #C7A977" : "1px solid var(--border-hex, #E4D9C6)",
          transition: "border-color 200ms, background 200ms",
        }}
        onClick={clickable ? onOpen : undefined}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? `${stage.label} — ${t("rd.enlarge_hint", "Enlarge")}` : undefined}
        onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}
      >
        {showImg ? (
          <>
            <img
              src={stage.img}
              alt={stage.label}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
              style={{ filter: trueColor ? "none" : active ? "grayscale(0.15) contrast(1.02)" : "grayscale(0.7) contrast(0.98) brightness(1.02)" }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "#9B8573", mixBlendMode: "multiply", opacity: trueColor ? 0 : active ? 0.14 : 0.22 }}
            />
            {clickable && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 22, height: 22, background: "rgba(47,47,43,0.55)" }}>
                <ExpandIcon size={12} color="white" />
              </span>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-end justify-center px-2 pb-1.5">
            <div className="w-[58%] h-[90%]">
              <Silhouette scaleX={stage.scaleX} color={active ? "#9B8573" : "#CDBFAE"} />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center" style={{ height: 16, marginTop: 8 }}>
        {active && (
          <span
            className="inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.16em] px-2 py-[3px] rounded-full leading-none"
            style={{ background: "#9B8573", color: "white" }}
          >
            {t("rd.you", "YOU")}
          </span>
        )}
      </div>

      <div className="mt-1.5 text-center px-0.5">
        <div className="text-[10.5px] font-semibold leading-tight" style={{ color: active ? "var(--ink, #2F2F2B)" : "var(--muted-fg, #6B5B4B)" }}>
          {stage.label}
        </div>
        {stage.sub && (
          <div className="text-[9.5px] mt-0.5 leading-tight" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
            {stage.sub}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Optional sexToggle prop: { value: "male"|"female", onChange } — renders a
 * compact body switcher in the strip header so the spectrum images can be
 * flipped between the male and female sets (preselected from the form).
 */
export default function StageStrip({ label, stages, activeKey, caption, trueColor = false, sexToggle = null }) {
  const { t } = useTranslation();
  const { open } = useLightbox();

  const galleryItems = stages.filter((s) => s.img).map((s) => ({
    src: s.img, label: s.label, sub: s.sub, active: s.key === activeKey,
  }));
  const activeStage = stages.find((s) => s.key === activeKey);
  const hasGallery = galleryItems.length > 0;

  const openAt = (stage) => {
    const idx = galleryItems.findIndex((it) => it.src === stage.img);
    open({
      title: label ?? t("rd.spectrum", "The spectrum"),
      caption,
      indicators: activeStage
        ? [{ label: t("rd.your_stage", "Your stage"), value: activeStage.sub ? `${activeStage.label} · ${activeStage.sub}` : activeStage.label }]
        : [],
      items: galleryItems,
      index: Math.max(0, idx),
    });
  };

  return (
    <div className="mt-7 pt-6" style={{ borderTop: "1px dashed var(--border-hex, #E4D9C6)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
          {label ?? t("rd.spectrum", "The spectrum")}
        </span>
        {sexToggle && (
          <span className="flex gap-0.5 rounded-full p-0.5" style={{ background: "rgba(47,47,43,0.05)", border: "1px solid var(--border-hex, #E4D9C6)" }}>
            {[
              { id: "male", label: t("rd.male", "Male") },
              { id: "female", label: t("rd.female", "Female") },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => sexToggle.onChange(opt.id)}
                className="rounded-full px-2.5 py-[3px] text-[10px] font-semibold transition-all"
                style={{
                  background: sexToggle.value === opt.id ? "var(--primary-hex, #9B8573)" : "transparent",
                  color: sexToggle.value === opt.id ? "white" : "var(--muted-fg, #6B5B4B)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </span>
        )}
        {hasGallery ? (
          <button
            onClick={() => openAt(activeStage || stages.find((s) => s.img))}
            className="inline-flex items-center gap-1.5 text-[10px] transition-colors hover:text-[var(--ink)]"
            style={{ color: "var(--muted-fg, #6B5B4B)" }}
          >
            <ExpandIcon size={12} color="currentColor" />
            {t("rd.enlarge_hint", "Enlarge")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9B8573" }} />
            {t("rd.your_stage", "Your stage")}
          </span>
        )}
      </div>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {stages.map((s) => (
          <StageFigure key={s.key} stage={s} active={s.key === activeKey} trueColor={trueColor} onOpen={s.img ? () => openAt(s) : undefined} />
        ))}
      </div>

      {caption && (
        <p className="text-[12.5px] leading-relaxed mt-5" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}
