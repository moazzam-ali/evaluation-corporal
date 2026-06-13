"use client";

import { useState } from "react";

/**
 * StageStrip — an integrated "spectrum" filmstrip that shows how a body
 * looks across the stages of a banded metric (body fat, BMI, WHR …) and
 * highlights the stage the user currently sits in.
 *
 * Designed to sit *inside* an existing metric card, beneath the numeric
 * gauge, so it deepens the explanation without breaking the minimal,
 * editorial feel of the results page.
 *
 * Imagery strategy:
 *  - If a real photo exists at `stage.img`, it's shown with a warm duotone
 *    treatment so every photo unifies with the theme regardless of source.
 *  - If the photo is missing or fails to load, we fall back to the brand
 *    body silhouette, horizontally scaled per stage (`stage.scaleX`) so a
 *    leaner stage reads narrower and a heavier stage reads broader. This
 *    keeps the strip expressive and on-brand before any photos are added,
 *    and it upgrades seamlessly once photos are dropped into /public.
 */

// Brand front-view silhouette (shared with the landing hero visual).
const FRONT_PATH =
  "M100 20 C 88 20 80 30 80 44 C 80 56 86 64 92 68 L 88 76 C 70 80 56 90 54 110 L 50 150 C 48 162 50 174 56 184 L 60 200 L 56 240 C 56 250 60 258 64 264 L 60 320 C 60 332 64 344 70 354 L 76 366 L 90 366 L 92 354 L 90 320 L 92 270 L 100 270 L 108 270 L 110 320 L 108 354 L 110 366 L 124 366 L 130 354 C 136 344 140 332 140 320 L 136 264 C 140 258 144 250 144 240 L 140 200 L 144 184 C 150 174 152 162 150 150 L 146 110 C 144 90 130 80 112 76 L 108 68 C 114 64 120 56 120 44 C 120 30 112 20 100 20 Z";

function Silhouette({ scaleX = 1, color }) {
  return (
    <svg viewBox="0 0 200 380" className="w-full h-full" preserveAspectRatio="xMidYMax meet" aria-hidden>
      {/* scale horizontally about the centre line (x = 100) to imply mass */}
      <g transform={`translate(100 0) scale(${scaleX} 1) translate(-100 0)`}>
        <path d={FRONT_PATH} fill={color} />
      </g>
    </svg>
  );
}

function StageFigure({ stage, active }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = stage.img && !imgFailed;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "3 / 4",
          borderRadius: 12,
          background: active
            ? "linear-gradient(180deg, #FFFFFF 0%, #F5EBD5 100%)"
            : "#F8F6F2",
          border: active ? "1.5px solid #C7A977" : "1px solid var(--border-hex, #E4D9C6)",
          transition: "border-color 200ms, background 200ms",
        }}
      >
        {showImg ? (
          <>
            <img
              src={stage.img}
              alt={stage.label}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
              style={{ filter: active ? "grayscale(0.15) contrast(1.02)" : "grayscale(0.7) contrast(0.98) brightness(1.02)" }}
            />
            {/* Warm duotone wash so any photo source matches the palette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "#9B8573", mixBlendMode: "multiply", opacity: active ? 0.14 : 0.22 }}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-end justify-center px-2 pb-1.5">
            <div className="w-[58%] h-[90%]">
              <Silhouette scaleX={stage.scaleX} color={active ? "#9B8573" : "#CDBFAE"} />
            </div>
          </div>
        )}

        {active && (
          <span
            className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.16em] px-2 py-[3px] rounded-full"
            style={{ background: "#9B8573", color: "white" }}
          >
            YOU
          </span>
        )}
      </div>

      <div className="mt-2.5 text-center px-0.5">
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

export default function StageStrip({ label = "The spectrum", stages, activeKey, caption }) {
  return (
    <div className="mt-7 pt-6" style={{ borderTop: "1px dashed var(--border-hex, #E4D9C6)" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
          {label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted-fg, #6B5B4B)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9B8573" }} />
          Your stage
        </span>
      </div>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
      >
        {stages.map((s) => (
          <StageFigure key={s.key} stage={s} active={s.key === activeKey} />
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
