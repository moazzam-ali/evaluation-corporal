"use client";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, Suspense } from "react";

/* ── tiny helpers ──────────────────────────────────────────────── */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Icon component (lucide-style) ─────────────────────────────── */
function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6 }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    arrow: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    check: <path d="M5 13l4 4L19 7" />,
    play: <polygon points="5 3 19 12 5 21 5 3" fill={color} stroke="none" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></>,
    posture: <><circle cx="12" cy="5" r="2" /><path d="M12 7v6M9 13h6M9 13l-2 8M15 13l2 8" /></>,
    dumbbell: <><path d="M6 6v12M2 9v6M22 9v6M18 6v12M6 12h12" /></>,
    droplet: <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
    leaf: <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19.2 2.96c.5-.5 1-1 1-1s.4 5.4-1.5 9.4c-1.4 3-5 4.6-7.7 4.6 0 0-.5 4-3 4 0 0-3-1-1-7" />,
    camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>,
    sparkle: <><path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" /></>,
    plan: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color} stroke="none" />,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
}

/* ── Score Ring ─────────────────────────────────────────────────── */
function ScoreRing({ value = 76, size = 120, stroke = 10, color = "var(--primary-hex)", track = "var(--muted)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
    </div>
  );
}

/* ── Body Silhouette — clinical, with calliper ticks ──────────── */
function BodySilhouette({ view = "front", width = 200, height = 380, fillColor, strokeColor, hotspots = [], showGuides = true }) {
  const fill = fillColor || "rgba(155, 133, 115, 0.10)";
  const stroke = strokeColor || "rgba(155, 133, 115, 0.45)";
  const guide = "rgba(155, 133, 115, 0.30)";
  const frontPath = "M100 20 C 88 20 80 30 80 44 C 80 56 86 64 92 68 L 88 76 C 70 80 56 90 54 110 L 50 150 C 48 162 50 174 56 184 L 60 200 L 56 240 C 56 250 60 258 64 264 L 60 320 C 60 332 64 344 70 354 L 76 366 L 90 366 L 92 354 L 90 320 L 92 270 L 100 270 L 108 270 L 110 320 L 108 354 L 110 366 L 124 366 L 130 354 C 136 344 140 332 140 320 L 136 264 C 140 258 144 250 144 240 L 140 200 L 144 184 C 150 174 152 162 150 150 L 146 110 C 144 90 130 80 112 76 L 108 68 C 114 64 120 56 120 44 C 120 30 112 20 100 20 Z";
  // Anchors used for measurement guides
  const NECK_Y = 76, CHEST_Y = 110, WAIST_Y = 190, HIP_Y = 240, KNEE_Y = 312;
  return (
    <div style={{ position: "relative", width, height }}>
      <svg viewBox="0 0 200 380" width={width} height={height}>
        <defs>
          <linearGradient id={`bodyG-${view}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={fill} />
            <stop offset="1" stopColor="rgba(155, 133, 115, 0.04)" />
          </linearGradient>
        </defs>

        {showGuides && (
          <g>
            {/* Vertical centerline */}
            <line x1="100" y1="14" x2="100" y2="372" stroke={guide} strokeWidth="0.6" strokeDasharray="2 4" />
            {/* Horizontal anchors at neck / chest / waist / hip / knee */}
            {[NECK_Y, CHEST_Y, WAIST_Y, HIP_Y, KNEE_Y].map((y, i) => (
              <g key={i}>
                <line x1="22" y1={y} x2="178" y2={y} stroke={guide} strokeWidth="0.5" strokeDasharray="1 3" />
                {/* tick marks on left ruler */}
                <line x1="18" y1={y} x2="26" y2={y} stroke={guide} strokeWidth="1" />
              </g>
            ))}
            {/* Left ruler edge */}
            <line x1="22" y1="14" x2="22" y2="372" stroke={guide} strokeWidth="0.6" />
            {/* Minor ruler ticks */}
            {Array.from({ length: 36 }, (_, i) => 24 + i * 10).map((y) => (
              <line key={y} x1="20" y1={y} x2="24" y2={y} stroke={guide} strokeWidth="0.4" />
            ))}
          </g>
        )}

        <path d={frontPath} fill={`url(#bodyG-${view})`} stroke={stroke} strokeWidth="1.1" />

        {hotspots.map((h, i) => (
          <g key={i}>
            <circle cx={h.x} cy={h.y} r="6" fill="white" stroke={h.color || "#9B8573"} strokeWidth="2" />
            <circle cx={h.x} cy={h.y} r="3" fill={h.color || "#9B8573"} />
            <circle cx={h.x} cy={h.y} r="10" fill={h.color || "#9B8573"} opacity="0.2">
              <animate attributeName="r" values="6;14;6" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
              <animate attributeName="opacity" values="0.45;0;0.45" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Hero Scan Visual — editorial photo + layered scanning fx ──── */
function HeroScanVisual({ height = 380 }) {
  const [imgFailed, setImgFailed] = useState(false);

  // If /hero-body.webp fails to load, fall back to the silhouette.
  if (imgFailed) {
    return (
      <div className="relative mt-2 flex justify-center items-center" style={{ height }}>
        <svg className="absolute inset-0 m-auto" width="300" height={height} viewBox="0 0 300 380">
          <circle cx="150" cy="190" r="120" fill="none" stroke="rgba(155,133,115,0.10)" strokeWidth="1" />
          <circle cx="150" cy="190" r="80" fill="none" stroke="rgba(155,133,115,0.12)" strokeWidth="1" strokeDasharray="2 6" />
        </svg>
        <BodySilhouette view="front" width={180} height={340} fillColor="rgba(155,133,115,0.10)" strokeColor="rgba(155,133,115,0.55)" hotspots={[
          { x: 100, y: 120, color: "#9B8573" },
          { x: 144, y: 200, color: "#9C5A4A" },
          { x: 60, y: 200, color: "#8D9A84" },
        ]} />
        <div className="absolute inset-x-[30px] inset-y-[30px] overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute inset-x-0 h-[2px] animate-[scanSweep_3.6s_ease-in-out_infinite]" style={{ background: "linear-gradient(90deg, rgba(155,133,115,0), rgba(155,133,115,0.6), rgba(155,133,115,0))", boxShadow: "0 0 18px rgba(155,133,115,0.5)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-2 overflow-hidden rounded-2xl" style={{ height }}>
      {/* Photo */}
      <Image
        src="/hero-body.webp"
        alt=""
        fill
        priority
        sizes="312px"
        className="object-cover"
        style={{ objectPosition: "center top" }}
        onError={() => setImgFailed(true)}
      />

      {/* Warm blend so the photo sits into the card */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(180deg, rgba(244,239,231,0.06) 0%, rgba(244,239,231,0) 18%, rgba(244,239,231,0) 78%, rgba(244,239,231,0.30) 100%)",
      }} />

      {/* Landmark markers — fade in once the opening scan pass completes,
          then pulse continuously */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 312 380" preserveAspectRatio="none">
        {[
          { x: 118, y: 104, color: "#9B8573" },
          { x: 196, y: 186, color: "#9C5A4A" },
          { x: 140, y: 268, color: "#8D9A84" },
        ].map((h, i) => (
          <g key={i} opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin={`${2.8 + i * 0.2}s`} fill="freeze" />
            <circle cx={h.x} cy={h.y} r="6" fill="white" stroke={h.color} strokeWidth="2" />
            <circle cx={h.x} cy={h.y} r="3" fill={h.color} />
            <circle cx={h.x} cy={h.y} r="10" fill={h.color} opacity="0.2">
              <animate attributeName="r" values="6;16;6" dur="2.6s" begin={`${3 + i * 0.5}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
              <animate attributeName="opacity" values="0.45;0;0.45" dur="2.6s" begin={`${3 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>

      {/* Continuous analysis sweep — first pass doubles as the opening scan */}
      <div
        className="absolute inset-x-0 pointer-events-none animate-[scanY_3.4s_cubic-bezier(0.45,0,0.55,1)_infinite]"
        style={{ height: 72, top: "-18%" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(199,169,119,0) 0%, rgba(199,169,119,0.10) 55%, rgba(199,169,119,0.28) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: "linear-gradient(90deg, rgba(199,169,119,0), rgba(199,169,119,0.85), rgba(199,169,119,0))", boxShadow: "0 0 22px rgba(199,169,119,0.65)" }} />
      </div>

      {/* Viewfinder corner brackets */}
      {[
        { top: 10, left: 10, bt: true, bl: true },
        { top: 10, right: 10, bt: true, br: true },
        { bottom: 10, left: 10, bb: true, bl: true },
        { bottom: 10, right: 10, bb: true, br: true },
      ].map((c, i) => (
        <span key={i} className="absolute w-5 h-5 pointer-events-none" style={{
          top: c.top, left: c.left, right: c.right, bottom: c.bottom,
          borderTop: c.bt ? "2px solid rgba(199,169,119,0.85)" : "none",
          borderBottom: c.bb ? "2px solid rgba(199,169,119,0.85)" : "none",
          borderLeft: c.bl ? "2px solid rgba(199,169,119,0.85)" : "none",
          borderRight: c.br ? "2px solid rgba(199,169,119,0.85)" : "none",
          borderRadius: 3,
        }} />
      ))}
    </div>
  );
}

/* ── Radar Chart ───────────────────────────────────────────────── */
function RadarChart({ t }) {
  const labels = [
    t("landing.radar_composition", "Composition"),
    t("landing.radar_posture", "Posture"),
    t("landing.radar_hydration", "Hydration"),
    t("landing.radar_recovery", "Recovery"),
    t("landing.radar_nutrition", "Nutrition"),
    t("landing.radar_muscle", "Muscle"),
  ];
  const valsA = [0.62, 0.78, 0.45, 0.7, 0.6, 0.7];
  const valsB = [0.78, 0.85, 0.62, 0.74, 0.72, 0.78];
  const cx = 180, cy = 180, R = 120;
  const pt = (v, i) => {
    const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  const polyA = valsA.map((v, i) => pt(v, i).join(",")).join(" ");
  const polyB = valsB.map((v, i) => pt(v, i).join(",")).join(" ");
  return (
    <svg viewBox="0 0 360 360" className="w-full h-auto" style={{ maxWidth: 360 }}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={Array.from({ length: 6 }, (_, k) => pt(s, k).join(",")).join(" ")} fill="none" stroke="var(--border-hex, #E4D9C6)" strokeWidth="1" />
      ))}
      {Array.from({ length: 6 }, (_, k) => {
        const [x, y] = pt(1, k);
        return <line key={k} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-hex, #E4D9C6)" strokeWidth="1" />;
      })}
      <polygon points={polyA} fill="rgba(47,47,43,0.04)" stroke="rgba(47,47,43,0.4)" strokeWidth="1" strokeDasharray="3 4" />
      <polygon points={polyB} fill="rgba(155,133,115,0.10)" stroke="var(--primary-hex, #9B8573)" strokeWidth="1.5" />
      {labels.map((l, i) => {
        const [x, y] = pt(1.18, i);
        return <text key={l} x={x} y={y} fontSize="11" fill="var(--muted-fg, #6B5B4B)" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-inter)" fontWeight="500">{l}</text>;
      })}
      {valsB.map((v, i) => { const [x2, y2] = pt(v, i); return <circle key={i} cx={x2} cy={y2} r="3" fill="white" stroke="var(--primary-hex, #9B8573)" strokeWidth="2" />; })}
    </svg>
  );
}

/* ── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ initials, size = 44 }) {
  const palettes = [
    "linear-gradient(135deg, #2F2F2B, #9B8573)",
    "linear-gradient(135deg, #8D9A84, #C7A977)",
    "linear-gradient(135deg, #C7A977, #9C5A4A)",
    "linear-gradient(135deg, #6B5B4B, #C7A977)",
    "linear-gradient(135deg, #1B2A47, #8D9A84)",
  ];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % palettes.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: palettes[idx],
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 600, fontSize: size * 0.32, letterSpacing: "0.02em", flexShrink: 0,
    }}>{initials}</div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageInner />
    </Suspense>
  );
}

function LandingPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const paramString = searchParams.toString();
  const scanHref = paramString ? `/scan?${paramString}` : "/scan";

  const SERVICE_ICONS = ["chart", "user", "posture", "plan", "droplet", "leaf"];
  const STEP_ICONS = ["user", "dumbbell", "leaf", "chart"];

  // Real scientific methods this app implements. Replaces a previously fabricated
  // brand-partnership strip — we list peer-reviewed equations we actually use.
  const SCIENCE_BADGES = [
    { key: "mifflin_st_jeor", label: "MIFFLIN-ST JEOR", sub: t("landing.science_badge_bmr", "BMR") },
    { key: "deurenberg",      label: "DEURENBERG",      sub: t("landing.science_badge_bodyfat", "Body fat %") },
    { key: "watson",          label: "WATSON",          sub: t("landing.science_badge_water", "Total body water") },
    { key: "lorentz",         label: "LORENTZ",         sub: t("landing.science_badge_weight", "Healthy weight") },
    { key: "who",             label: "WHO BANDS",       sub: t("landing.science_badge_bmi", "BMI classification") },
    { key: "gdpr",            label: "GDPR",            sub: t("landing.science_badge_privacy", "Data privacy") },
  ];

  const METRIC_ICONS = ["chart", "user", "posture", "plan", "sparkle", "dumbbell", "droplet", "flame"];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden" style={{ background: "#F4EFE7" }}>

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden pb-0 pt-16 sm:pt-20" id="hero" style={{ background: "#F4EFE7" }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(155,133,115,0.06) 0%, rgba(155,133,115,0) 55%)" }} />

        <div className="mx-auto max-w-[920px] px-5 sm:px-8 relative text-center" style={{ paddingTop: 64 }}>
          {/* Eyebrow pill */}
          <Reveal className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-xs font-medium shadow-[var(--shadow-xs)]" style={{ borderColor: "var(--border-hex)", fontFamily: "var(--font-inter)" }}>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-white" style={{ background: "var(--ink)" }}>
                {t("landing.hero_badge_new", "NEW")}
              </span>
              {t("landing.hero_badge", "Body composition scan · in beta")}
            </span>
          </Reveal>

          {/* Title */}
          <Reveal delay={0.08}>
            <h1 className="mx-auto mt-7 text-[clamp(48px,7vw,84px)] leading-[0.98] tracking-[-0.035em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
              {t("landing.hero_title_1", "See your body.")}<br />
              <span style={{ fontStyle: "italic", color: "var(--primary-hex)" }}>{t("landing.hero_title_2", "Know your plan.")}</span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={0.16}>
            <p className="mx-auto mt-7 max-w-[58ch] text-lg leading-relaxed" style={{ color: "var(--muted-fg)", fontWeight: 400 }}>
              {t("landing.hero_subtitle")}
            </p>
          </Reveal>

          {/* CTA buttons */}
          <Reveal delay={0.24} className="flex flex-wrap justify-center gap-3 mt-9">
            <Link href={scanHref} className="inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium text-white transition-all hover:-translate-y-px" style={{ background: "var(--ink)", fontFamily: "var(--font-inter)" }}>
              {t("landing.hero_cta", "Start your free scan")}
              <Icon name="arrow" size={14} color="white" />
            </Link>
            <button className="inline-flex items-center gap-2.5 rounded-full border px-5 py-3.5 text-sm font-medium transition-all hover:-translate-y-px" style={{ background: "white", color: "var(--ink)", borderColor: "var(--border-strong)", fontFamily: "var(--font-inter)" }}>
              <Icon name="play" size={12} color="var(--ink)" />
              {t("landing.hero_demo_cta", "Watch a 60-sec demo")}
            </button>
          </Reveal>

          {/* Trust points */}
          <Reveal delay={0.28} className="flex flex-wrap justify-center gap-6 mt-6 text-xs" style={{ color: "var(--muted-fg)" }}>
            {["hero_trust_1", "hero_trust_2", "hero_trust_3"].map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <Icon name="check" size={13} color="var(--primary-hex)" />
                {t(`landing.${key}`)}
              </span>
            ))}
          </Reveal>
        </div>

        {/* ── HERO VISUAL ── */}
        <Reveal delay={0.32}>
          <div className="relative mx-auto mt-16 hidden md:block" style={{ maxWidth: 1100, height: 540, marginBottom: 0 }}>
            {/* Soft floor shadow */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-[50%]" style={{ width: 820, height: 520, background: "radial-gradient(ellipse at center, rgba(47,47,43,0.05), rgba(47,47,43,0))", filter: "blur(2px)" }} />

            {/* Center card with body silhouette */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{
              top: 30, width: 360, height: 480,
              background: "linear-gradient(180deg, #FFFFFF 0%, #F4EFE7 100%)",
              border: "1px solid var(--border-hex)", borderRadius: 28, padding: 24,
              boxShadow: "0 30px 80px rgba(47,47,43,0.10), 0 4px 12px rgba(47,47,43,0.04)",
            }}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium tracking-[0.14em] uppercase" style={{ color: "var(--primary-hex)", fontFamily: "var(--font-inter)" }}>ASSESSMENT</span>
                <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted-fg)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-good-hex)" }} />
                  Calculating
                </span>
              </div>

              <HeroScanVisual height={380} />

              {/* Single front-view confirmation strip */}
              <div
                className="text-center text-[10px] font-semibold tracking-[0.14em] py-2 rounded-lg"
                style={{
                  background: "var(--primary-soft)",
                  border: "1px solid rgba(155,133,115,0.25)",
                  color: "var(--primary-deep)",
                }}
              >
                {t("landing.scan_card_view", "FRONT VIEW · CAPTURING")}
              </div>
            </div>

            {/* Left floating card — BMI (reveals after opening scan) */}
            <div className="absolute" style={{ left: 100, top: 90, width: 220, background: "white", border: "1px solid var(--border-hex)", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-lg)", opacity: 0, animation: "chipIn 0.6s var(--ease-out) 2.6s forwards, floatA 6s ease-in-out 3.2s infinite" }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>BMI</div>
              <div className="flex items-center gap-3.5 mt-2">
                <ScoreRing value={76} size={72} stroke={6} color="#8D9A84" track="rgba(47,47,43,0.06)" />
                <div>
                  <div className="text-[22px] font-medium" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>23.4</div>
                  <div className="text-[11px] mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "var(--status-good-bg)", color: "var(--status-good-hex)" }}>
                    Healthy
                  </div>
                </div>
              </div>
            </div>

            {/* Right floating card — Body Fat (reveals after opening scan) */}
            <div className="absolute" style={{ right: 100, top: 180, width: 220, background: "white", border: "1px solid var(--border-hex)", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-lg)", opacity: 0, animation: "chipIn 0.6s var(--ease-out) 2.78s forwards, floatB 7s ease-in-out 3.4s infinite" }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>BODY FAT</div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-[30px]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>18.2</span>
                <span className="text-[13px]" style={{ color: "var(--muted-fg)" }}>%</span>
              </div>
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: "rgba(47,47,43,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: "45%", background: "var(--status-good-hex)" }} />
              </div>
            </div>

            {/* Bottom-right dark card — calories (reveals after opening scan) */}
            <div className="absolute" style={{ right: 140, bottom: 40, width: 200, background: "var(--ink)", color: "white", borderRadius: 16, padding: 16, boxShadow: "0 18px 40px rgba(47,47,43,0.18)", opacity: 0, animation: "chipIn 0.6s var(--ease-out) 2.96s forwards, floatA 8s ease-in-out 3.6s infinite" }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--sky)" }}>DAILY CALORIES</div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-[30px]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>2,148</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>kcal</span>
              </div>
              <div className="h-1 rounded-full mt-2.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="h-full rounded-full" style={{ width: "62%", background: "var(--sky)" }} />
              </div>
            </div>

            {/* Bottom-left — WHR (reveals after opening scan) */}
            <div className="absolute" style={{ left: 150, bottom: 60, width: 180, background: "white", border: "1px solid var(--border-hex)", borderRadius: 16, padding: 14, boxShadow: "var(--shadow-lg)", opacity: 0, animation: "chipIn 0.6s var(--ease-out) 3.14s forwards, floatB 7.5s ease-in-out 3.8s infinite" }}>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>WAIST-TO-HIP</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[22px]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>0.82</span>
                <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: "var(--status-good-bg)", color: "var(--status-good-hex)" }}>Low risk</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────────── SCIENCE STRIP ───────────── */}
      <div className="border-y bg-white py-9" style={{ borderColor: "rgba(47,47,43,0.06)" }}>
        <div className="text-center text-[11px] font-medium uppercase tracking-[0.18em] mb-6" style={{ color: "var(--muted-fg)" }}>
          {t("landing.science_strip", "Methods we use · peer-reviewed")}
        </div>
        <div className="mx-auto max-w-[1100px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-4 px-4">
          {SCIENCE_BADGES.map(b => (
            <div key={b.key} className="flex flex-col items-center text-center">
              <span className="text-[12px] font-bold tracking-[0.14em]" style={{ color: "var(--ink)", fontFamily: "var(--font-dm-sans)" }}>{b.label}</span>
              <span className="mt-1 text-[10.5px]" style={{ color: "var(--muted-fg)", letterSpacing: "0.04em" }}>{b.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────── STATS ───────────── */}
      <section className="py-[72px]" style={{ background: "#F4EFE7" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i, idx) => (
              <Reveal key={i} delay={idx * 0.06}>
                <div className="text-center px-3" style={{ borderRight: idx < 3 ? "1px solid var(--border-hex)" : "none" }}>
                  <div className="text-[clamp(40px,5vw,56px)] leading-none tracking-[-0.03em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                    {t(`landing.stats_${i}_value`)}
                  </div>
                  <div className="text-[13px] leading-relaxed mt-2.5 mx-auto max-w-[26ch]" style={{ color: "var(--muted-fg)" }}>
                    {t(`landing.stats_${i}_label`)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── METRICS WE CALCULATE ───────────── */}
      <section className="py-24 lg:py-32 overflow-hidden" id="metrics" style={{ background: "white", borderTop: "1px solid var(--border-hex)" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="mb-16 max-w-[720px]">
            <Reveal>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
                {t("landing.metrics_label")}
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-3 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                {t("landing.metrics_title_1")} <span style={{ fontStyle: "italic", color: "var(--primary-hex)" }}>{t("landing.metrics_title_2")}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-4 max-w-[58ch] text-base leading-relaxed" style={{ color: "var(--muted-fg)" }}>
                {t("landing.metrics_subtitle")}
              </p>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ alignItems: "stretch" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i, idx) => (
              <Reveal key={i} delay={(idx % 4) * 0.06}>
                <div className="group flex flex-col h-full rounded-[20px] border bg-white p-6 transition-all hover:-translate-y-1 hover:border-[var(--primary-hex)] hover:shadow-[var(--shadow-md)]" style={{ borderColor: "var(--border-hex)" }}>
                  <div className="mb-4 w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-soft)" }}>
                    <Icon name={METRIC_ICONS[idx]} size={20} color="var(--primary-hex)" />
                  </div>
                  <h3 className="text-[20px] tracking-[-0.01em] mb-1.5" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                    {t(`landing.metric_${i}_title`)}
                  </h3>
                  <p className="text-[12.5px] leading-relaxed flex-1" style={{ color: "var(--muted-fg)" }}>
                    {t(`landing.metric_${i}_body`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── SERVICES ───────────── */}
      <section className="py-24 lg:py-32 bg-white" style={{ borderTop: "1px solid var(--border-hex)" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="text-center mb-16">
            <Reveal>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
                {t("landing.services_label")}
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-3 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                {t("landing.services_title_1")} <span style={{ fontStyle: "italic", color: "var(--primary-hex)" }}>{t("landing.services_title_2")}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-4 max-w-[58ch] mx-auto text-base leading-relaxed" style={{ color: "var(--muted-fg)" }}>
                {t("landing.services_subtitle")}
              </p>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ alignItems: "stretch" }}>
            {[1, 2, 3, 4, 5, 6].map((i, idx) => (
              <Reveal key={i} delay={idx * 0.06}>
                <div className="flex flex-col h-full rounded-[20px] border bg-white p-7 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]" style={{ borderColor: "var(--border-hex)" }}>
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 mb-4" style={{ background: "var(--primary-soft)", border: "1px solid rgba(155,133,115,0.12)" }}>
                    <Icon name={SERVICE_ICONS[idx]} size={20} color="var(--primary-hex)" />
                  </div>
                  <h3 className="text-[22px] tracking-[-0.01em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                    {t(`landing.service_${i}_title`)}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed mt-2.5 flex-1" style={{ color: "var(--muted-fg)" }}>
                    {t(`landing.service_${i}_body`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Plan engine callout */}
          <Reveal delay={0.2}>
            <div className="mt-16 rounded-3xl border p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center" style={{ background: "#F4EFE7", borderColor: "var(--border-hex)" }}>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
                  {t("landing.service_plan_label")}
                </div>
                <h3 className="mt-3 text-[clamp(28px,3vw,38px)] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                  {t("landing.service_plan_title_1")} <span style={{ fontStyle: "italic", color: "var(--primary-hex)" }}>{t("landing.service_plan_title_2")}</span>
                </h3>
                <p className="mt-4 text-[14.5px] leading-relaxed max-w-[44ch]" style={{ color: "var(--muted-fg)" }}>
                  {t("landing.service_plan_body")}
                </p>
                <div className="flex flex-wrap gap-2.5 mt-6">
                  <button className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium text-white" style={{ background: "var(--ink)" }}>
                    {t("landing.service_plan_cta_1")}
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[13px] font-medium" style={{ background: "white", color: "var(--ink)", borderColor: "var(--border-strong)" }}>
                    {t("landing.service_plan_cta_2")}
                  </button>
                </div>
              </div>
              <div className="rounded-[18px] border bg-white p-5 sm:p-7 flex justify-center" style={{ borderColor: "var(--border-hex)" }}>
                <RadarChart t={t} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="py-24 lg:py-32" style={{ background: "#F4EFE7", borderTop: "1px solid var(--border-hex)" }} id="how">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="text-center mb-16">
            <Reveal>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
                {t("landing.how_label")}
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-3 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                {t("landing.how_title_1")} <span style={{ fontStyle: "italic", color: "var(--primary-hex)" }}>{t("landing.how_title_2")}</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 relative" style={{ alignItems: "stretch" }}>
            {/* Connector line */}
            <div className="hidden xl:block absolute left-[12.5%] right-[12.5%] top-7 h-px border-t border-dashed" style={{ borderColor: "var(--border-strong)" }} />

            {[1, 2, 3, 4].map((i, idx) => (
              <Reveal key={i} delay={idx * 0.08}>
                <div className="relative flex flex-col h-full rounded-[20px] border bg-white p-7" style={{ borderColor: "var(--border-hex)" }}>
                  {/* Step circle */}
                  <div className="w-14 h-14 rounded-full bg-white border flex items-center justify-center relative -mt-14 shadow-[var(--shadow-xs)] shrink-0" style={{ borderColor: "var(--border-hex)" }}>
                    <Icon name={STEP_ICONS[idx]} size={20} color="var(--primary-hex)" />
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] mt-5" style={{ color: "var(--muted-fg)" }}>
                    STEP {t(`landing.how_step${i}_num`, `0${i}`)}
                  </div>
                  <h3 className="text-[26px] tracking-[-0.01em] mt-2 mb-2.5" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                    {t(`landing.how_step${i}_title`)}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed flex-1" style={{ color: "var(--muted-fg)" }}>
                    {t(`landing.how_step${i}_text`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FORMULAS / SCIENCE ───────────── */}
      <section className="py-24 lg:py-32 overflow-hidden" id="science" style={{ background: "var(--ink)", color: "white" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="mb-16 max-w-[720px]">
            <Reveal>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--sky)" }}>
                {t("landing.formulas_label")}
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-3 text-[clamp(36px,4.2vw,56px)] leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                {t("landing.formulas_title_1")} <span style={{ fontStyle: "italic", color: "var(--sky)" }}>{t("landing.formulas_title_2")}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-4 max-w-[58ch] text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                {t("landing.formulas_subtitle")}
              </p>
            </Reveal>
          </div>

          <div className="grid lg:grid-cols-3 gap-5" style={{ alignItems: "stretch" }}>
            {[1, 2, 3].map((i, idx) => (
              <Reveal key={i} delay={idx * 0.08}>
                <div className="flex flex-col h-full rounded-3xl border p-7 sm:p-8 transition-all hover:-translate-y-1 hover:border-[rgba(199,169,119,0.4)]" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <div className="mb-6 text-[11px] tracking-[0.2em]" style={{ color: "var(--sky)" }}>
                    {t(`landing.formula_${i}_eq`)}
                  </div>
                  <h3 className="mb-1.5 text-[28px] leading-tight" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                    {t(`landing.formula_${i}_name`)}
                  </h3>
                  <div className="mb-4 text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--sky)" }}>
                    {t(`landing.formula_${i}_what`)}
                  </div>
                  <p className="mb-5 text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {t(`landing.formula_${i}_desc`)}
                  </p>
                  <div className="pt-5 border-t mt-auto" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.55)" }}>Evidence</div>
                    <div className="mt-1 text-lg" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                      <span style={{ color: "var(--sky)" }}>{t(`landing.formula_${i}_evidence`)}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="py-24 lg:py-32 bg-white" style={{ borderTop: "1px solid var(--border-hex)" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          {/* Header */}
          <div className="grid lg:grid-cols-2 gap-12 items-end mb-14">
            <div>
              <Reveal>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
                  {t("landing.testimonials_label")}
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-3 text-[clamp(32px,4vw,52px)] leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                  {t("landing.testimonials_title_1")} <span style={{ fontStyle: "italic", color: "var(--primary-hex)" }}>{t("landing.testimonials_title_2")}</span>.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={0.12}>
              <div className="pb-2">
                <p className="text-[15px] leading-relaxed max-w-[44ch]" style={{ color: "var(--muted-fg)" }}>
                  {t("landing.testimonials_subtitle")}
                </p>
                <div className="flex gap-5 mt-5 items-center">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" size={16} color="var(--status-normal-hex)" />)}
                  </div>
                  <span className="text-[13px]" style={{ color: "var(--muted-fg)" }}>
                    {t("landing.testimonials_beta", "Feedback from our early beta coaches and users.")}
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Featured quote */}
          <Reveal>
            <div className="rounded-3xl border p-7 sm:p-12 mb-4 relative" style={{ background: "#F4EFE7", borderColor: "var(--border-hex)" }}>
              <div className="absolute top-6 right-8 select-none" style={{ fontFamily: "var(--font-fraunces)", fontSize: 140, lineHeight: 1, color: "var(--primary-soft)" }}>&ldquo;</div>
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" size={16} color="var(--status-normal-hex)" />)}
              </div>
              <blockquote className="text-[clamp(22px,3vw,32px)] leading-[1.35] tracking-[-0.015em] max-w-[32ch]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                &ldquo;{t("landing.testimonial_1_text")}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3.5 mt-8">
                <Avatar initials="MC" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{t("landing.testimonial_1_name")}</div>
                  <div className="text-xs" style={{ color: "var(--muted-fg)" }}>{t("landing.testimonial_1_role")}</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Smaller quotes grid */}
          <div className="grid sm:grid-cols-2 gap-4" style={{ alignItems: "stretch" }}>
            {[2, 3, 4, 5].map((i, idx) => {
              const initials = [null, null, "SL", "DO", "PR", "LM"][i];
              const stars = i === 4 ? 4 : 5;
              return (
                <Reveal key={i} delay={idx * 0.06}>
                  <div className="flex flex-col h-full rounded-[20px] border bg-white p-7" style={{ borderColor: "var(--border-hex)" }}>
                    <div className="flex gap-0.5 mb-3.5">
                      {Array.from({ length: 5 }, (_, k) => <Icon key={k} name="star" size={13} color={k < stars ? "var(--status-normal-hex)" : "var(--border-strong)"} />)}
                    </div>
                    <p className="text-[19px] leading-[1.4] tracking-[-0.01em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                      &ldquo;{t(`landing.testimonial_${i}_text`)}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-6 pt-4.5 border-t" style={{ borderColor: "var(--border-hex)" }}>
                      <Avatar initials={initials} size={36} />
                      <div>
                        <div className="text-[13px] font-semibold">{t(`landing.testimonial_${i}_name`)}</div>
                        <div className="text-[11px]" style={{ color: "var(--muted-fg)" }}>{t(`landing.testimonial_${i}_role`)}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── BIG CTA ───────────── */}
      <section className="py-24" style={{ background: "#F4EFE7" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] text-center text-white px-6 py-16 sm:px-10 sm:py-[72px]" style={{ background: "var(--ink)" }}>
              {/* Decorative circles */}
              <svg className="absolute inset-0 opacity-[0.18]" width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="none">
                <circle cx="500" cy="200" r="120" fill="none" stroke="#C7A977" strokeWidth="1" />
                <circle cx="500" cy="200" r="200" fill="none" stroke="#C7A977" strokeWidth="1" strokeDasharray="3 6" />
                <circle cx="500" cy="200" r="280" fill="none" stroke="#C7A977" strokeWidth="1" />
              </svg>

              <div className="relative">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "var(--sky)" }}>
                  {t("landing.cta_label")}
                </div>
                <div className="mt-4 text-[clamp(32px,4.5vw,56px)] leading-[1.05] tracking-[-0.025em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                  {t("landing.cta_title_1")} <span style={{ fontStyle: "italic", color: "var(--sky)" }}>{t("landing.cta_title_2")}</span>.
                </div>
                <p className="mx-auto mt-4 max-w-[52ch] text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {t("landing.cta_body")}
                </p>
                <div className="flex flex-wrap gap-3 justify-center mt-8">
                  <Link href={scanHref} className="inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium transition-all hover:-translate-y-px" style={{ background: "white", color: "var(--ink)" }}>
                    {t("landing.cta_primary")} <Icon name="arrow" size={14} color="var(--ink)" />
                  </Link>
                  <button className="inline-flex items-center gap-2.5 rounded-full border px-5 py-3.5 text-sm font-medium text-white" style={{ borderColor: "rgba(255,255,255,0.3)", background: "transparent" }}>
                    {t("landing.cta_secondary")}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="bg-white pt-16 pb-8" style={{ borderTop: "1px solid var(--border-hex)" }}>
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] mb-12">
            {/* Brand */}
            <div>
              <Link href="/" className="inline-flex items-center gap-1.5">
                <Image src="/logo-mark.svg" alt="Evaluación Corporal" width={16} height={44} className="h-11 w-auto shrink-0" unoptimized />
                <span className="text-xl tracking-[-0.01em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                  {t("nav.brand")}
                </span>
              </Link>
              <p className="mt-6 text-xl leading-[1.35] max-w-[26ch] tracking-[-0.01em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
                {t("landing.footer_tagline")}
              </p>
            </div>

            {/* Footer columns */}
            {["product", "company", "resources", "contact"].map((col) => (
              <div key={col}>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] mb-3.5" style={{ color: "var(--muted-fg)" }}>
                  {t(`landing.footer_col_${col}`)}
                </div>
                <div className="flex flex-col gap-2.5 text-[13px]" style={{ color: "var(--muted-fg)" }}>
                  {t(`landing.footer_${col}_items`, "").split(",").map(item => (
                    <a key={item} className="hover:text-[var(--ink)] transition-colors cursor-pointer">{item.trim()}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="pt-6 border-t flex flex-wrap justify-between gap-4 text-xs" style={{ borderColor: "var(--border-hex)", color: "var(--muted-fg)" }}>
            <span>{t("landing.footer_copyright")}</span>
            <span>{t("landing.footer_disclaimer")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
