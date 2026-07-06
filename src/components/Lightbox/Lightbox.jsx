"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Global image lightbox. Mount <LightboxProvider> once (in ClientLayout);
 * any component can call useLightbox().open(payload) to show a near-fullscreen
 * viewer — built for coaches walking clients through the visuals.
 *
 * payload = {
 *   title?: string,                       // small eyebrow above the figure label
 *   caption?: string,                     // explanatory paragraph (side panel)
 *   indicators?: [{ label, value }],      // extra read-outs (side panel)
 *   items: [{ src, label?, sub?, active?, badge? }],
 *   index?: number,                       // starting item
 *   sexToggle?: {                         // body switcher inside the viewer
 *     value: "male" | "female",           //   preselected set
 *     onChange?: (sex) => void,           //   keeps the page behind in sync
 *     itemsBySex: { male: [...], female: [...] },
 *     captionBySex?: { male, female },    //   optional caption swap
 *   },
 * }
 */
const LightboxCtx = createContext(null);
export function useLightbox() {
  return useContext(LightboxCtx) || { open: () => {}, close: () => {} };
}

function ExpandIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

export function LightboxProvider({ children }) {
  const { t } = useTranslation();
  const [state, setState] = useState(null);

  const open = useCallback((payload) => {
    if (!payload?.items?.length) return;
    setState({ index: 0, ...payload });
  }, []);
  const close = useCallback(() => setState(null), []);
  const go = useCallback((delta) => {
    setState((s) => (s ? { ...s, index: (s.index + delta + s.items.length) % s.items.length } : s));
  }, []);
  const goTo = useCallback((i) => setState((s) => (s ? { ...s, index: i } : s)), []);
  // Swap the whole gallery to the other body's image set. The caller keeps
  // the page behind in sync via sexToggle.onChange (fired from the button).
  const setSex = useCallback((sex) => {
    setState((s) => {
      if (!s?.sexToggle?.itemsBySex?.[sex] || s.sexToggle.value === sex) return s;
      const items = s.sexToggle.itemsBySex[sex];
      return {
        ...s,
        items,
        index: Math.min(s.index, items.length - 1),
        caption: s.sexToggle.captionBySex?.[sex] ?? s.caption,
        sexToggle: { ...s.sexToggle, value: sex },
      };
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [state, close, go]);

  const cur = state?.items?.[state.index];
  const multi = (state?.items?.length || 0) > 1;

  // Swipe left/right to navigate on touch devices.
  const touchStart = useRef(null);
  const onTouchStart = (e) => { const p = e.changedTouches[0]; touchStart.current = { x: p.clientX, y: p.clientY }; };
  const onTouchEnd = (e) => {
    if (!multi || !touchStart.current) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - touchStart.current.x;
    const dy = p.clientY - touchStart.current.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  return (
    <LightboxCtx.Provider value={{ open, close }}>
      {children}
      {state && cur && (
        <div
          className="fixed inset-0 z-[120] flex flex-col"
          style={{ background: "rgba(31,28,24,0.94)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          {/* Top bar */}
          <div className="flex items-start justify-between px-5 sm:px-8 pt-5 pb-3" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0">
              {state.title && (
                <div className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.55)" }}>{state.title}</div>
              )}
              {cur.label && (
                <div className="text-[20px] sm:text-[24px] leading-tight mt-0.5" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "white" }}>
                  {cur.label}{cur.sub ? <span style={{ color: "rgba(255,255,255,0.55)" }}> · {cur.sub}</span> : null}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 pl-4">
              {multi && (
                <span className="text-[12px] tabular-nums" style={{ color: "rgba(255,255,255,0.55)" }}>{state.index + 1} / {state.items.length}</span>
              )}
              <button
                onClick={close}
                aria-label={t("rd.viewer_close", "Close")}
                className="flex items-center justify-center rounded-full transition-colors"
                style={{ width: 38, height: 38, background: "rgba(255,255,255,0.10)", color: "white" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          </div>

          {/* Main: image + side panel */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center gap-6 px-4 sm:px-10 pb-2 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex items-center justify-center" style={{ flex: "1 1 auto", maxWidth: "min(92vw, 720px)" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {multi && (
                <button onClick={() => go(-1)} aria-label={t("navigation.previous", "Previous")} className="absolute left-1 sm:-left-4 z-10 flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(20,18,16,0.55)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", color: "white" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )}
              <div className="relative">
                <img
                  src={cur.src}
                  alt={cur.label || ""}
                  style={{ maxHeight: "76vh", maxWidth: "100%", objectFit: "contain", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
                />
                {cur.active && (
                  <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.18em] px-3 py-1 rounded-full" style={{ background: "#C7A977", color: "#2F2F2B" }}>
                    {t("rd.you", "YOU")}
                  </span>
                )}
              </div>
              {multi && (
                <button onClick={() => go(1)} aria-label={t("navigation.next", "Next")} className="absolute right-1 sm:-right-4 z-10 flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(20,18,16,0.55)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", color: "white" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              )}
            </div>

            {(state.caption || (state.indicators && state.indicators.length > 0)) && (
              <div className="w-full lg:w-[320px] shrink-0">
                {state.caption && (
                  <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>{state.caption}</p>
                )}
                {state.indicators && state.indicators.length > 0 && (
                  <div className="mt-5 flex flex-col gap-3.5">
                    {state.indicators.map((ind) => (
                      <div key={ind.label} className="pl-3" style={{ borderLeft: "2px solid rgba(199,169,119,0.6)" }}>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.5)" }}>{ind.label}</div>
                        <div className="text-[14px] mt-0.5" style={{ color: "white" }}>{ind.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body switcher — flips the whole gallery between the male and
              female sets; the strips on the page behind follow along. */}
          {state.sexToggle && (
            <div className="flex justify-center px-5 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1 rounded-full p-1" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)" }}>
                {[
                  { id: "male", label: t("rd.male", "Male") },
                  { id: "female", label: t("rd.female", "Female") },
                ].map((opt) => {
                  const active = state.sexToggle.value === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { if (!active) { state.sexToggle.onChange?.(opt.id); setSex(opt.id); } }}
                      className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all"
                      style={{
                        background: active ? "#C7A977" : "transparent",
                        color: active ? "#2F2F2B" : "rgba(255,255,255,0.75)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Thumbnail strip (gallery) */}
          {multi && (
            <div className="flex items-center justify-center gap-2 px-5 py-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
              {state.items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="shrink-0 overflow-hidden rounded-lg transition-all"
                  style={{
                    width: 48, height: 64,
                    border: i === state.index ? "2px solid #C7A977" : "2px solid transparent",
                    opacity: i === state.index ? 1 : 0.5,
                  }}
                >
                  <img src={it.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </LightboxCtx.Provider>
  );
}

export { ExpandIcon };
