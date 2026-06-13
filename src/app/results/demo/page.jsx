"use client";

import { Suspense } from "react";
import Link from "next/link";
import StageStrip from "@/components/StageStrip/StageStrip";

/* ── Stage spectrum definitions ────────────────────────────────────
   Each metric's visual stages, lean → heavy. `scaleX` drives the
   fallback silhouette width; `img` points at an optional real photo
   under /public/stages (auto-used when present, silhouette otherwise).
   `pick` returns the active stage key for a measured value.            */
const STAGES = {
  bodyFat: {
    caption:
      "You read in the Fitness band — visible tone without extremes. The figures show the typical external look across the male body-fat range.",
    pick: (v) => (v <= 8 ? "essential" : v <= 14 ? "athletic" : v <= 18 ? "fitness" : v <= 25 ? "average" : "high"),
    stages: [
      { key: "essential", label: "Essential", sub: "2–8%", scaleX: 0.80, img: "/stages/bodyfat-essential.webp" },
      { key: "athletic", label: "Athletic", sub: "8–14%", scaleX: 0.90, img: "/stages/bodyfat-athletic.webp" },
      { key: "fitness", label: "Fitness", sub: "14–18%", scaleX: 1.00, img: "/stages/bodyfat-fitness.webp" },
      { key: "average", label: "Average", sub: "18–25%", scaleX: 1.12, img: "/stages/bodyfat-average.webp" },
      { key: "high", label: "High", sub: "25%+", scaleX: 1.26, img: "/stages/bodyfat-high.webp" },
    ],
  },
  bmi: {
    caption:
      "BMI maps weight to height only — it can't see muscle. The silhouettes show the broad external shape each band tends to produce.",
    pick: (v) => (v < 18.5 ? "under" : v < 25 ? "healthy" : v < 30 ? "over" : "obese"),
    stages: [
      { key: "under", label: "Underweight", sub: "<18.5", scaleX: 0.82, img: "/stages/bmi-under.webp" },
      { key: "healthy", label: "Healthy", sub: "18.5–25", scaleX: 0.98, img: "/stages/bmi-healthy.webp" },
      { key: "over", label: "Overweight", sub: "25–30", scaleX: 1.14, img: "/stages/bmi-over.webp" },
      { key: "obese", label: "Obese", sub: "30+", scaleX: 1.30, img: "/stages/bmi-obese.webp" },
    ],
  },
  whr: {
    caption:
      "Waist-to-hip ratio reflects where fat sits. Lower ratios carry less cardiometabolic risk; the shapes show low, moderate and high distribution.",
    pick: (v) => (v <= 0.9 ? "low" : v <= 0.95 ? "moderate" : "high"),
    stages: [
      { key: "low", label: "Low risk", sub: "<0.90", scaleX: 0.92, img: "/stages/whr-low.webp" },
      { key: "moderate", label: "Moderate", sub: "0.90–0.95", scaleX: 1.08, img: "/stages/whr-moderate.webp" },
      { key: "high", label: "High risk", sub: "0.95+", scaleX: 1.24, img: "/stages/whr-high.webp" },
    ],
  },
};

/* ── Demo data ─────────────────────────────────────────────────── */
const DEMO = {
  user: { firstName: "Carlos", lastName: "Rivera", age: 32, height: 178, weight: 82, metabolicAge: 29 },
  bmi: 25.9,
  bodyFat: 18.2,
  whr: 0.88,
  weight: 82,
  weightGoal: 78,
  weightDelta: 4,
  healthyRange: [68, 82],
  lbmPct: 81.8,
  lbmKg: 67.1,
  tbwPct: 56,
  tbwL: 45.9,
  calories: 2148,
  bmr: 1780,
  activity: 668,
  deficit: 300,
  macros: {
    protein: { g: 148, pct: 28 },
    carbs: { g: 215, pct: 40 },
    fats: { g: 75, pct: 32 },
  },
  products: [
    { name: "Rebuild Strength", condition: "Athlete recovery", icon: "dumbbell", why: "Post-workout recovery formula with BCAAs. Matched to your exercise frequency of 4–5 days/week.", dose: "1 scoop", timing: "Post workout", grad: "#2F2F2B, #9B8573" },
    { name: "Phyto Complete", condition: "Belly fat", icon: "leaf", why: "Plant-based meal replacement designed to support weight management and reduce abdominal fat.", dose: "1 serving", timing: "Lunch swap", grad: "#8D9A84, #2F2F2B" },
    { name: "HerbalifeLine Max", condition: "Cholesterol", icon: "droplet", why: "Omega-3 EPA+DHA supplement supporting cardiovascular health and healthy cholesterol levels.", dose: "1 softgel", timing: "With breakfast", grad: "#6B5B4B, #C7A977" },
  ],
  radarData: [
    { label: "Compos.", now: 0.78, prev: 0.72 },
    { label: "Weight",  now: 0.82, prev: 0.75 },
    { label: "Hydra.",  now: 0.56, prev: 0.62 },
    { label: "Caloric", now: 0.74, prev: 0.70 },
    { label: "Muscle",  now: 0.81, prev: 0.78 },
    { label: "Cardio",  now: 0.68, prev: 0.65 },
  ],
  risks: [
    { tone: "good", label: "STRENGTH", note: "Lean mass up 0.8 kg. Deficit is sparing muscle." },
    { tone: "normal", label: "WATCH", note: "Hydration at 56% — below the 60% ideal." },
    { tone: "alert", label: "ACTION", note: "WHR at upper edge. Anterior fat pattern." },
  ],
};

/* ── Tone colors ───────────────────────────────────────────────── */
const TONES = {
  good:   { fill: "#8D9A84", soft: "rgba(46,139,107,0.12)",  chip: "#EAEFE6", text: "#1F6B50" },
  normal: { fill: "#C7A977", soft: "rgba(198,138,46,0.10)",  chip: "#F5EBD5", text: "#8E6418" },
  alert:  { fill: "#9C5A4A", soft: "rgba(216,69,91,0.10)",   chip: "#EFDDD5", text: "#A22A3D" },
};

/* ── Icon ──────────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const d = {
    arrow: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    check: <path d="M5 13l4 4L19 7" />,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></>,
    dumbbell: <><path d="M6 6v12M2 9v6M22 9v6M18 6v12M6 12h12" /></>,
    droplet: <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />,
    leaf: <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19.2 2.96c.5-.5 1-1 1-1s.4 5.4-1.5 9.4c-1.4 3-5 4.6-7.7 4.6 0 0-.5 4-3 4 0 0-3-1-1-7" />,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" /></>,
  };
  return <svg {...p}>{d[name] || null}</svg>;
}

/* ── Linear Range Gauge ────────────────────────────────────────── */
function LinearRange({ value, min, max, segments, unit, caption, decimals = 1 }) {
  const pct = (v) => ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100;
  let prev2 = min;
  const segs = segments.map(s => { const a = pct(prev2), b = pct(s.to); prev2 = s.to; return { ...s, a, b }; });
  const active = segments.find(s => value <= s.to) || segments[segments.length - 1];
  const tone = TONES[active.tone] || TONES.normal;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[64px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{Number(value).toFixed(decimals)}</span>
          <span className="text-xs uppercase tracking-[0.16em] font-medium" style={{ color: "var(--muted-fg)" }}>{unit}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: tone.chip, color: tone.text }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.fill }} />
          {active.label}
        </span>
      </div>
      <div className="relative pb-8">
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(47,47,43,0.04)" }}>
          {segs.map((s, i) => (
            <div key={i} className="absolute top-0 bottom-0" style={{ left: `${s.a}%`, width: `${s.b - s.a}%`, background: (TONES[s.tone] || TONES.normal).soft, borderRight: i < segs.length - 1 ? "1px solid rgba(255,255,255,0.85)" : "none" }} />
          ))}
        </div>
        <div className="absolute" style={{ left: `${pct(value)}%`, top: -1, transform: "translateX(-50%)", width: 2, height: 18, background: tone.fill, borderRadius: 1 }} />
        <div className="absolute left-0 right-0 top-6 flex justify-between pointer-events-none">
          {segs.map((s, i) => (
            <span key={i} className="text-[10px] font-medium" style={{ color: s === active ? tone.text : "var(--muted-fg)", letterSpacing: "0.04em" }}>{s.label}</span>
          ))}
        </div>
      </div>
      {caption && <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted-fg)" }}>{caption}</p>}
    </div>
  );
}

/* ── Card ──────────────────────────────────────────────────────── */
function Card({ children, dark, className = "" }) {
  return (
    <div className={`rounded-[20px] ${className}`} style={{
      background: dark ? "var(--ink)" : "white",
      color: dark ? "white" : "var(--ink)",
      border: dark ? "none" : "1px solid var(--border-hex, #E4D9C6)",
      padding: "26px 30px 28px",
      boxShadow: dark ? "var(--shadow-md)" : "var(--shadow-xs)",
    }}>{children}</div>
  );
}

function CardHeader({ title, action }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-5">
      <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ink)" }}>{title}</span>
      {action && <span className="text-[11px]" style={{ color: "var(--muted-fg)", letterSpacing: "0.04em" }}>{action}</span>}
    </div>
  );
}

/* ── Chapter Band ──────────────────────────────────────────────── */
function ChapterBand({ eyebrow, title }) {
  return (
    <div className="relative overflow-hidden py-24 sm:py-28" style={{ background: "linear-gradient(180deg, #F4EFE7 0%, #FFFFFF 100%)", borderTop: "1px solid var(--border-hex)", borderBottom: "1px solid var(--border-hex)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(155,133,115,0.04) 0%, rgba(155,133,115,0) 60%)" }} />
      <div className="relative text-center max-w-[800px] mx-auto px-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--primary-hex, #9B8573)" }}>{eyebrow}</div>
        <h2 className="mt-4 text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-0.03em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>{title}</h2>
      </div>
    </div>
  );
}

/* ── Radar Chart ───────────────────────────────────────────────── */
function Radar({ data }) {
  const cx = 180, cy = 180, R = 130, n = data.length;
  const pt = (v, i) => { const a = (Math.PI * 2 / n) * i - Math.PI / 2; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
  const polyNow = data.map((d, i) => pt(d.now, i).join(",")).join(" ");
  const polyPrev = data.map((d, i) => pt(d.prev, i).join(",")).join(" ");
  return (
    <svg width="360" height="360" viewBox="0 0 360 360">
      {[0.25, 0.5, 0.75, 1].map(s => <polygon key={s} points={Array.from({ length: n }, (_, k) => pt(s, k).join(",")).join(" ")} fill="none" stroke="var(--border-hex, #E4D9C6)" strokeWidth="1" />)}
      {Array.from({ length: n }, (_, k) => { const [x, y] = pt(1, k); return <line key={k} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-hex, #E4D9C6)" strokeWidth="1" />; })}
      <polygon points={polyPrev} fill="rgba(47,47,43,0.04)" stroke="rgba(47,47,43,0.35)" strokeWidth="1" strokeDasharray="3 4" />
      <polygon points={polyNow} fill="rgba(155,133,115,0.10)" stroke="var(--primary-hex, #9B8573)" strokeWidth="2" />
      {data.map((d, i) => { const [x, y] = pt(d.now, i); return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="var(--primary-hex, #9B8573)" strokeWidth="2" />; })}
      {data.map((d, i) => { const [x, y] = pt(1.2, i); return <text key={d.label} x={x} y={y} fontSize="11" fontFamily="var(--font-inter)" fontWeight="600" fill="var(--ink, #2F2F2B)" textAnchor="middle" dominantBaseline="middle">{d.label}</text>; })}
    </svg>
  );
}

/* ── Brand body path (shared with StageStrip silhouette) ───────── */
const BODY_PATH =
  "M100 20 C 88 20 80 30 80 44 C 80 56 86 64 92 68 L 88 76 C 70 80 56 90 54 110 L 50 150 C 48 162 50 174 56 184 L 60 200 L 56 240 C 56 250 60 258 64 264 L 60 320 C 60 332 64 344 70 354 L 76 366 L 90 366 L 92 354 L 90 320 L 92 270 L 100 270 L 108 270 L 110 320 L 108 354 L 110 366 L 124 366 L 130 354 C 136 344 140 332 140 320 L 136 264 C 140 258 144 250 144 240 L 140 200 L 144 184 C 150 174 152 162 150 150 L 146 110 C 144 90 130 80 112 76 L 108 68 C 114 64 120 56 120 44 C 120 30 112 20 100 20 Z";

/* ── Composition figure — body filled by lean vs fat share ───────
   The body reads as a "fill gauge": lean fills the figure, fat is the
   top slice. Labels carry the meaning, so it's a proportion cue, not an
   anatomical map. Makes an abstract percentage instantly imaginable.   */
function CompositionFigure({ fatPct }) {
  const top = 20, bottom = 366;                         // body path vertical bounds
  const divY = top + (bottom - top) * (fatPct / 100);  // fat occupies the top slice
  return (
    <svg viewBox="0 0 200 386" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs><clipPath id="compClip"><path d={BODY_PATH} /></clipPath></defs>
      <g clipPath="url(#compClip)">
        <rect x="0" y="0" width="200" height="386" fill="#8D9A84" />{/* lean */}
        <rect x="0" y="0" width="200" height={divY} fill="#9B8573" />{/* fat */}
        <line x1="0" x2="200" y1={divY} y2={divY} stroke="#F4EFE7" strokeWidth="2.5" strokeDasharray="3 4" />
      </g>
      <path d={BODY_PATH} fill="none" stroke="rgba(47,47,43,0.16)" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Hydration column — current fill against the ideal reference ── */
function HydrationColumn({ pct, ideal = 60, min = 40, max = 70 }) {
  const fill = ((pct - min) / (max - min)) * 100;
  const ref = ((ideal - min) / (max - min)) * 100;
  return (
    <div className="relative shrink-0 overflow-hidden" style={{ width: 46, height: 168, borderRadius: 24, background: "rgba(47,47,43,0.04)", border: "1px solid var(--border-hex, #E4D9C6)" }}>
      <div className="absolute left-0 right-0 bottom-0" style={{ height: `${fill}%`, background: "linear-gradient(180deg, #D8C39A, #C7A977)" }} />
      <div className="absolute left-0 right-0" style={{ bottom: `${ref}%`, borderTop: "1.5px dashed rgba(47,47,43,0.45)" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DEMO RESULTS PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function DemoResultsPage() {
  const d = DEMO;
  return (
    <Suspense fallback={null}>
      <div className="min-h-screen" style={{ background: "#F4EFE7", fontFamily: "var(--font-inter)" }}>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden text-center" style={{ padding: "120px 56px 80px", background: "radial-gradient(ellipse at 50% -10%, rgba(155,133,115,0.06), transparent 50%), #F4EFE7" }}>
          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-20 h-px" style={{ background: "var(--ink)", opacity: 0.4 }} />
          <div className="relative max-w-[920px] mx-auto">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
              EVALUACIÓN CORPORAL · 14 MAY 2026
            </div>
            <h1 className="mt-10 text-[clamp(64px,10vw,120px)] leading-[0.95] tracking-[-0.045em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "var(--ink)" }}>
              {d.user.firstName} <span style={{ fontStyle: "italic", fontWeight: 400 }}>{d.user.lastName}.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-[44ch] text-lg leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              Your body assessment — a snapshot of where you stand today. Read it once, then let the plan do the work.
            </p>

            {/* Meta strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 mt-16 py-7" style={{ borderTop: "1px solid var(--border-hex)", borderBottom: "1px solid var(--border-hex)" }}>
              {[
                { l: "Age", v: d.user.age, u: "years" },
                { l: "Height", v: d.user.height, u: "cm" },
                { l: "Weight", v: d.user.weight, u: "kg" },
                { l: "Metabolic age", v: d.user.metabolicAge, u: "years", note: `${d.user.age - d.user.metabolicAge} yrs younger` },
              ].map((m, i, arr) => (
                <div key={m.l} className="flex flex-col items-center py-2" style={{ borderRight: i < arr.length - 1 ? "1px solid var(--border-hex)" : "none" }}>
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{m.l}</div>
                  <div className="text-[40px] leading-none font-semibold mt-3" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{m.v}</div>
                  <div className="text-[11px] mt-1.5" style={{ color: "var(--muted-fg)", letterSpacing: "0.06em" }}>{m.u}</div>
                  {m.note && (
                    <span className="mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAEFE6", color: "#1F6B50" }}>
                      {m.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CHAPTER: WHERE YOU SIT TODAY ── */}
        <ChapterBand eyebrow="BODY METRICS" title="Where your body sits today." />

        <section className="py-20 sm:py-24" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            {/* Row 1: BMI + Body Fat */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader title="Body Mass Index" action="WHO reference" />
                <LinearRange value={d.bmi} min={15} max={40} segments={[
                  { to: 18.5, label: "Under", tone: "normal" },
                  { to: 25, label: "Healthy", tone: "good" },
                  { to: 30, label: "Over", tone: "normal" },
                  { to: 40, label: "Obese", tone: "alert" },
                ]} unit="kg / m²" caption="Sits 0.9 above the healthy ceiling. Lean mass explains most of that — composition reads cleaner than BMI alone." />
                <StageStrip stages={STAGES.bmi.stages} activeKey={STAGES.bmi.pick(d.bmi)} caption={STAGES.bmi.caption} />
              </Card>
              <Card>
                <CardHeader title="Body Fat" action={`Male · ${d.user.age} years`} />
                <LinearRange value={d.bodyFat} min={5} max={32} segments={[
                  { to: 8, label: "Essential", tone: "alert" },
                  { to: 14, label: "Athletic", tone: "good" },
                  { to: 18, label: "Fitness", tone: "good" },
                  { to: 25, label: "Average", tone: "normal" },
                  { to: 32, label: "High", tone: "alert" },
                ]} unit="percent" caption="Comfortable inside the fitness band. Trending down from last assessment." />
                <StageStrip stages={STAGES.bodyFat.stages} activeKey={STAGES.bodyFat.pick(d.bodyFat)} caption={STAGES.bodyFat.caption} />
              </Card>
            </div>

            {/* Row 2: WHR + Weight */}
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-4 mb-4">
              <Card>
                <CardHeader title="Waist-to-Hip Ratio" action="Cardiometabolic risk" />
                <LinearRange value={d.whr} min={0.75} max={1.05} segments={[
                  { to: 0.90, label: "Low", tone: "good" },
                  { to: 0.95, label: "Moderate", tone: "normal" },
                  { to: 1.05, label: "High", tone: "alert" },
                ]} unit="ratio" decimals={2} caption="Low risk range. Anterior fat pattern accounts for the position; mobility work helps." />
                <StageStrip stages={STAGES.whr.stages} activeKey={STAGES.whr.pick(d.whr)} caption={STAGES.whr.caption} />
              </Card>
              <Card>
                <CardHeader title="Weight Analysis" action="Lorentz healthy band" />
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>DELTA TO GOAL</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[72px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>−{d.weightDelta}</span>
                      <span className="text-lg" style={{ color: "var(--muted-fg)" }}>kg</span>
                    </div>
                    <div className="text-[11px] mt-2" style={{ color: "var(--muted-fg)" }}>~12 weeks at the current rate</div>
                  </div>
                  {/* Weight scale bar */}
                  <div>
                    <div className="relative h-1.5 rounded-full" style={{ background: "rgba(47,47,43,0.04)" }}>
                      <div className="absolute top-0 h-full rounded-full" style={{ left: `${((d.healthyRange[0] - 60) / 30) * 100}%`, width: `${((d.healthyRange[1] - d.healthyRange[0]) / 30) * 100}%`, background: "rgba(46,139,107,0.18)" }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2" style={{ left: `${((d.weight - 60) / 30) * 100}%`, transform: "translate(-50%, -50%)", borderColor: "var(--primary-hex)" }} />
                    </div>
                    <div className="flex justify-between mt-3 text-[11px]" style={{ color: "var(--muted-fg)" }}>
                      <span>Current: <strong style={{ color: "var(--ink)" }}>{d.weight} kg</strong></span>
                      <span>Goal: <strong style={{ color: "var(--ink)" }}>{d.weightGoal} kg</strong></span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded-sm" style={{ background: "rgba(46,139,107,0.18)" }} />
                        Healthy {d.healthyRange[0]}–{d.healthyRange[1]} kg
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 3: LBM + TBW */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader title="Body Composition" action="Lean vs fat" />
                <div className="flex items-center gap-5">
                  <div className="shrink-0" style={{ width: 104, height: 168 }}>
                    <CompositionFigure fatPct={d.bodyFat} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-end gap-4">
                      <div>
                        <span className="text-[48px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{d.lbmPct}</span>
                        <span className="text-base ml-1" style={{ color: "var(--muted-fg)" }}>%</span>
                        <div className="text-[10px] font-medium uppercase tracking-[0.14em] mt-1" style={{ color: "var(--muted-fg)" }}>LEAN MASS</div>
                      </div>
                      <div className="pb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[20px] font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{d.lbmKg}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>kg</span></span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAEFE6", color: "#1F6B50" }}>+0.8 kg</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5">
                      {[
                        { c: "#8D9A84", k: "Lean", v: `${d.lbmPct}%` },
                        { c: "#9B8573", k: "Fat", v: `${d.bodyFat}%` },
                      ].map(r => (
                        <div key={r.k} className="flex items-center gap-2 text-[12px]">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.c }} />
                          <span style={{ color: "var(--ink)" }}>{r.k}</span>
                          <span className="ml-auto font-semibold" style={{ color: "var(--ink)" }}>{r.v}</span>
                        </div>
                      ))}
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-fg)" }}>of which body water {d.tbwPct}% · part of lean</div>
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed mt-5" style={{ color: "var(--muted-fg)" }}>Lean mass up 0.8 kg since last assessment — the deficit is sparing muscle.</p>
              </Card>
              <Card>
                <CardHeader title="Total Body Water" action="Hydration share" />
                <div className="flex items-center gap-5">
                  <HydrationColumn pct={d.tbwPct} ideal={60} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-end gap-4">
                      <div>
                        <span className="text-[48px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{d.tbwPct}</span>
                        <span className="text-base ml-1" style={{ color: "var(--muted-fg)" }}>%</span>
                        <div className="text-[10px] font-medium uppercase tracking-[0.14em] mt-1" style={{ color: "var(--muted-fg)" }}>BODY WATER</div>
                      </div>
                      <div className="pb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[20px] font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{d.tbwL}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>L</span></span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EFDDD5", color: "#A22A3D" }}>−1.2 L</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#C7A977" }} />
                        <span style={{ color: "var(--ink)" }}>Now</span>
                        <span className="ml-auto font-semibold" style={{ color: "var(--ink)" }}>{d.tbwPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: "rgba(47,47,43,0.45)" }} />
                        <span style={{ color: "var(--ink)" }}>Ideal</span>
                        <span className="ml-auto font-semibold" style={{ color: "var(--ink)" }}>60%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed mt-5" style={{ color: "var(--muted-fg)" }}>Below the 60% reference. Daily intake target raised to 2.5 L.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* ── CHAPTER: ENERGY & NUTRITION ── */}
        <ChapterBand eyebrow="ENERGY & NUTRITION" title="What your body needs from here." />

        <section className="py-20 sm:py-24" style={{ background: "white" }}>
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            {/* Calories + Macros */}
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4 mb-8">
              {/* Caloric needs — dark card */}
              <Card dark className="relative overflow-hidden flex flex-col justify-between min-h-[420px]">
                <svg className="absolute -right-20 -top-24 opacity-15" width="440" height="440" viewBox="0 0 440 440">
                  <circle cx="220" cy="220" r="120" fill="none" stroke="#C7A977" strokeWidth="1" />
                  <circle cx="220" cy="220" r="190" fill="none" stroke="#C7A977" strokeWidth="1" strokeDasharray="2 6" />
                </svg>
                <div className="relative">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.7)" }}>Daily energy</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(199,169,119,0.16)", color: "#C7A977" }}>
                      Goal · Weight control
                    </span>
                  </div>
                  <div className="text-[clamp(80px,12vw,140px)] leading-none font-semibold mt-6" style={{ fontFamily: "var(--font-inter)" }}>
                    {d.calories.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>kilocalories · per day</div>
                </div>
                <div className="relative mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="flex h-1.5 rounded-full overflow-hidden mb-5 gap-0.5">
                    <div style={{ flex: d.bmr, background: "rgba(255,255,255,0.55)" }} />
                    <div style={{ flex: d.activity, background: "#C7A977" }} />
                    <div style={{ flex: d.deficit, background: "rgba(216,69,91,0.7)" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { dot: "rgba(255,255,255,0.55)", label: "BMR · at rest", value: d.bmr.toLocaleString(), unit: "kcal" },
                      { dot: "#C7A977", label: "Activity", value: `+${d.activity}`, unit: "kcal" },
                      { dot: "rgba(216,69,91,0.7)", label: "Deficit", value: `−${d.deficit}`, unit: "kcal" },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: s.dot }} />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
                        </div>
                        <div className="text-[24px] font-semibold mt-1.5" style={{ fontFamily: "var(--font-inter)" }}>
                          {s.value}<span className="text-[11px] ml-1 font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>{s.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Macros */}
              <Card className="flex flex-col justify-between min-h-[420px]" style={{ background: "#F4EFE7" }}>
                <div>
                  <CardHeader title="Macro Split" action="Per day" />
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>FEATURED · DAILY PROTEIN</div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-[72px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>{d.macros.protein.g}</span>
                    <span className="text-xl" style={{ color: "var(--muted-fg)" }}>g</span>
                  </div>
                  <p className="text-[13px] leading-relaxed mt-3 max-w-[34ch]" style={{ color: "var(--muted-fg)" }}>
                    Calibrated to your lean mass. Holds muscle through the deficit; carbs and fats fill the remainder.
                  </p>
                </div>
                {/* Macro bar */}
                <div className="mt-6">
                  <div className="flex h-14 rounded-[10px] overflow-hidden gap-0.5" style={{ background: "var(--muted)" }}>
                    {[
                      { pct: d.macros.protein.pct, color: "var(--primary-hex, #9B8573)" },
                      { pct: d.macros.carbs.pct, color: "var(--status-normal-hex, #C7A977)" },
                      { pct: d.macros.fats.pct, color: "var(--sky, #C7A977)" },
                    ].map((m, i) => (
                      <div key={i} className="relative flex items-end p-2" style={{ flex: m.pct, background: m.color }}>
                        <span className="text-[11px] font-bold text-white tracking-[0.08em]">{m.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { key: "Protein", g: d.macros.protein.g, color: "var(--primary-hex, #9B8573)" },
                      { key: "Carbs", g: d.macros.carbs.g, color: "var(--status-normal-hex, #C7A977)" },
                      { key: "Fats", g: d.macros.fats.g, color: "var(--sky, #C7A977)" },
                    ].map(m => (
                      <div key={m.key} className="pt-2.5" style={{ borderTop: `2px solid ${m.color}` }}>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{m.key}</div>
                        <div className="text-[26px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>
                          {m.g}<span className="text-[13px] ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Product Recommendations */}
            <div className="mt-12">
              <div className="grid md:grid-cols-2 gap-12 items-end mb-9">
                <div>
                  <CardHeader title="Recommended" action="3 picks · tied to signals" />
                  <h3 className="text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.028em] mt-2" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                    Three items.<br />
                    <span style={{ fontStyle: "italic", color: "var(--primary-hex, #9B8573)" }}>One reason each.</span>
                  </h3>
                </div>
                <p className="text-[14.5px] leading-relaxed pb-1.5" style={{ color: "var(--muted-fg)", maxWidth: "44ch" }}>
                  Each item is tied to a specific signal in your assessment. If the signal isn't yours, the item isn't either.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {d.products.map((p, i) => (
                  <Card key={i} className="flex flex-col">
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px dashed var(--border-hex)" }}>
                      <div className="w-11 h-11 rounded-[11px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.grad})` }}>
                        <Icon name={p.icon} size={18} color="white" />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--primary-hex, #9B8573)" }}>
                        FOR · {p.condition.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-[26px] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>{p.name}</h4>
                    <p className="text-[13.5px] leading-relaxed mt-3 flex-1" style={{ color: "var(--muted-fg)" }}>{p.why}</p>
                    <div className="grid grid-cols-2 gap-2 mt-6 pt-4" style={{ borderTop: "1px solid var(--border-hex)" }}>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>DOSE</div>
                        <div className="text-[13px] font-semibold mt-1" style={{ color: "var(--ink)" }}>{p.dose}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>TIMING</div>
                        <div className="text-[13px] font-semibold mt-1" style={{ color: "var(--ink)" }}>{p.timing}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CHAPTER: HEALTH OVERVIEW ── */}
        <ChapterBand eyebrow="HEALTH OVERVIEW" title="The full picture, at a glance." />

        <section className="py-20 sm:py-24" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            {/* Risk callouts */}
            <div className="grid sm:grid-cols-3 gap-3 mb-12">
              {d.risks.map((r, i) => (
                <div key={i} className="relative rounded-[14px] border bg-white p-5" style={{ borderColor: "var(--border-hex)" }}>
                  <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full" style={{ background: `var(--status-${r.tone}-hex, ${TONES[r.tone].fill})` }} />
                  <div className="pl-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: TONES[r.tone].fill }}>{r.label}</div>
                    <div className="text-[13.5px] font-medium mt-2 leading-relaxed" style={{ color: "var(--ink)" }}>{r.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Radar + Summary */}
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-4">
              <Card className="flex flex-col" style={{ background: "#F4EFE7" }}>
                <div className="flex justify-between items-baseline mb-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ink)" }}>Profile</span>
                  <div className="flex gap-4 text-[11px]" style={{ color: "var(--muted-fg)" }}>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: "var(--primary-hex)" }} />Current</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: "rgba(47,47,43,0.35)" }} />Previous</span>
                  </div>
                </div>
                <div className="flex-1 flex justify-center items-center">
                  <Radar data={d.radarData} />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-5" style={{ borderTop: "1px dashed var(--border-hex)" }}>
                  {d.radarData.map(r => {
                    const delta = Math.round((r.now - r.prev) * 100);
                    return (
                      <div key={r.label}>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--muted-fg)" }}>{r.label}</div>
                        <div className="text-[20px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: delta >= 0 ? "var(--primary-hex, #9B8573)" : "#9C5A4A" }}>
                          {delta > 0 ? "+" : ""}{delta}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Coach note */}
              <Card>
                <CardHeader title="Summary" />
                <h3 className="text-[clamp(28px,3vw,36px)] leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                  <span style={{ fontStyle: "italic" }}>{d.user.firstName}</span> —
                </h3>
                <div className="mt-6 text-[15px] leading-[1.7] flex flex-col gap-5" style={{ color: "var(--ink)" }}>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>What's working.</strong>{" "}
                    Body fat is in the fitness band and lean mass added 0.8 kg. The deficit isn't eating your muscle.
                  </p>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>What's drifting.</strong>{" "}
                    Hydration sits at 1.2 L average against a 2.5 L target. Total body water reads 56% — below ideal.
                  </p>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>This week.</strong>{" "}
                    One swap, one habit. Trade Tuesday's pasta for grilled fish and greens; add a 12:30 hydration reminder.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-5 sm:px-8 pb-24" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto rounded-[28px] relative overflow-hidden" style={{ background: "var(--ink)", color: "white", padding: "56px 64px" }}>
            <svg className="absolute -right-28 -top-28 opacity-[0.18]" width="540" height="540" viewBox="0 0 540 540">
              <circle cx="270" cy="270" r="150" fill="none" stroke="#C7A977" strokeWidth="1" />
              <circle cx="270" cy="270" r="220" fill="none" stroke="#C7A977" strokeWidth="1" strokeDasharray="3 6" />
            </svg>
            <div className="relative grid lg:grid-cols-[1.4fr_auto] gap-12 items-center">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "#C7A977" }}>NEXT ASSESSMENT</div>
                <h3 className="mt-4 text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.028em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                  Book your follow-up for <span style={{ fontStyle: "italic", color: "#C7A977" }}>11 June</span>.
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed max-w-[52ch]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Four weeks gives the plan time to bend the trend lines. We'll compare side-by-side and rebuild the next phase from actual results.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                <Link href="/" className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium" style={{ background: "white", color: "var(--ink)" }}>
                  Back to home <Icon name="arrow" size={14} color="var(--ink)" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium" style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Icon name="download" size={13} color="white" /> Download report
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="px-5 sm:px-8 pb-12" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto rounded-[14px] border p-4 flex items-start gap-3 text-xs leading-relaxed" style={{ borderColor: "var(--border-hex)", background: "white", color: "var(--muted-fg)" }}>
            <span className="shrink-0 mt-0.5">⚕</span>
            <span><strong style={{ color: "var(--ink)" }}>Health assessment · not medical advice.</strong> Body composition and metrics are estimates based on published formulas. Consult a healthcare professional for diagnosis.</span>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
