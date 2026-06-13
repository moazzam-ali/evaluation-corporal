"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import StageStrip from "@/components/StageStrip/StageStrip";

/* ── Active-stage pickers (numeric only; labels live in the component) ── */
const PICK = {
  bmi: (v) => (v < 18.5 ? "under" : v < 25 ? "healthy" : v < 30 ? "over" : "obese"),
  bodyFat: (v) => (v <= 8 ? "essential" : v <= 14 ? "athletic" : v <= 18 ? "fitness" : v <= 25 ? "average" : "high"),
  whr: (v) => (v <= 0.9 ? "low" : v <= 0.95 ? "moderate" : "high"),
};

/* ── Demo data (numbers + non-translatable names) ──────────────── */
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
  radarData: [
    { now: 0.78, prev: 0.72 },
    { now: 0.82, prev: 0.75 },
    { now: 0.56, prev: 0.62 },
    { now: 0.74, prev: 0.70 },
    { now: 0.81, prev: 0.78 },
    { now: 0.68, prev: 0.65 },
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
          {segs.map((s, i) => {
            const st = TONES[s.tone] || TONES.normal;
            return (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: s === active ? tone.text : "var(--muted-fg)", letterSpacing: "0.04em" }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.fill }} />
                {s.label}
              </span>
            );
          })}
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

/* ── Composition ring — lean vs fat as an elegant donut ───────── */
function CompositionRing({ leanPct }) {
  const { t } = useTranslation();
  const cx = 80, cy = 80, r = 58, sw = 18;
  const C = 2 * Math.PI * r;
  const lean = (leanPct / 100) * C;
  const fat = C - lean;
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden>
      <g transform="rotate(-90 80 80)">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(47,47,43,0.05)" strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8D9A84" strokeWidth={sw} strokeDasharray={`${lean} ${C - lean}`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#9B8573" strokeWidth={sw} strokeDasharray={`${fat} ${C - fat}`} strokeDashoffset={-lean} />
      </g>
      <text x="80" y="78" textAnchor="middle" fontSize="30" fontWeight="600" fill="#2F2F2B" fontFamily="var(--font-inter)">
        {leanPct}<tspan fontSize="14">%</tspan>
      </text>
      <text x="80" y="97" textAnchor="middle" fontSize="9" letterSpacing="2" fontWeight="600" fill="#6B5B4B" fontFamily="var(--font-inter)">{t("rd.lean_short", "LEAN")}</text>
    </svg>
  );
}

/* ── Hydration column — current fill against the ideal reference ── */
function HydrationColumn({ pct, ideal = 60, min = 40, max = 70 }) {
  const fill = ((pct - min) / (max - min)) * 100;
  const ref = ((ideal - min) / (max - min)) * 100;
  return (
    <div className="relative shrink-0 overflow-hidden" style={{ width: 44, height: 150, borderRadius: 22, background: "rgba(47,47,43,0.04)", border: "1px solid var(--border-hex, #E4D9C6)" }}>
      <div className="absolute left-0 right-0 bottom-0" style={{ height: `${fill}%`, background: "linear-gradient(180deg, #D8C39A, #C7A977)" }} />
      <div className="absolute left-0 right-0" style={{ bottom: `${ref}%`, borderTop: "1.5px dashed rgba(47,47,43,0.45)" }} />
    </div>
  );
}

/* ── Weight trajectory — projected descent from now to goal ────── */
function WeightTrajectory({ start, goal, weeks = 12, healthyCeil }) {
  const { t } = useTranslation();
  const xL = 30, xR = 330, yT = 16, yB = 104;
  const wTop = Math.max(start, healthyCeil) + 1;
  const wBot = goal - 1;
  const X = (wk) => xL + (wk / weeks) * (xR - xL);
  const Y = (w) => yT + ((wTop - w) / (wTop - wBot)) * (yB - yT);
  const ss = (tt) => tt * tt * (3 - 2 * tt);                    // smoothstep ease
  const pts = Array.from({ length: weeks + 1 }, (_, k) => [X(k), Y(start - (start - goal) * ss(k / weeks))]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${X(weeks).toFixed(1)} ${yB} L ${X(0).toFixed(1)} ${yB} Z`;
  const yCeil = Y(healthyCeil);
  const nowLabel = t("rd.now", "Now");
  return (
    <svg viewBox="0 0 360 130" className="w-full" style={{ height: "auto" }} aria-hidden>
      <defs>
        <linearGradient id="wtArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B8573" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#9B8573" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={xL} y={yCeil} width={xR - xL} height={yB - yCeil} fill="#8D9A84" opacity="0.10" />
      <line x1={xL} x2={xR} y1={yCeil} y2={yCeil} stroke="#8D9A84" strokeWidth="1" strokeDasharray="3 4" />
      <text x={xR} y={yCeil - 5} fontSize="9" fill="#6B5B4B" textAnchor="end" fontFamily="var(--font-inter)">{t("rd.healthy_le", "Healthy ≤ {{n}} kg", { n: healthyCeil })}</text>
      <path d={area} fill="url(#wtArea)" />
      <path d={line} fill="none" stroke="#9B8573" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(0)} cy={Y(start)} r="4.5" fill="white" stroke="#9B8573" strokeWidth="2.5" />
      <circle cx={X(weeks)} cy={Y(goal)} r="4.5" fill="white" stroke="#8D9A84" strokeWidth="2.5" />
      <text x={X(0) + 8} y={Y(start) - 8} fontSize="10" fontWeight="600" fill="#2F2F2B" textAnchor="start" fontFamily="var(--font-inter)">{nowLabel} {start}</text>
      <text x={X(weeks) - 8} y={Y(goal) + 16} fontSize="10" fontWeight="600" fill="#2F2F2B" textAnchor="end" fontFamily="var(--font-inter)">{t("rd.goal", "Goal")} {goal}</text>
      {[0, weeks / 2, weeks].map((wk, i) => (
        <text key={i} x={X(wk)} y={124} fontSize="9" fill="#6B5B4B" textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} fontFamily="var(--font-inter)">{wk === 0 ? nowLabel : `${wk} ${t("rd.wk", "wk")}`}</text>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DEMO RESULTS PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function DemoResultsPage() {
  const { t } = useTranslation();
  const d = DEMO;
  const bmiGoal = (d.weightGoal / (d.user.height / 100) ** 2).toFixed(1);
  const fatKg = (d.weight * d.bodyFat / 100).toFixed(1);

  const meta = [
    { l: t("rd.meta_age", "Age"), v: d.user.age, u: t("rd.unit_years", "years") },
    { l: t("rd.meta_height", "Height"), v: d.user.height, u: t("rd.unit_cm", "cm") },
    { l: t("rd.meta_weight", "Weight"), v: d.user.weight, u: t("rd.unit_kg", "kg") },
    { l: t("rd.meta_metabolic", "Metabolic age"), v: d.user.metabolicAge, u: t("rd.unit_years", "years"), note: t("rd.metabolic_note", "{{n}} yrs younger", { n: d.user.age - d.user.metabolicAge }) },
  ];

  const bmiSegments = [
    { to: 18.5, label: t("rd.bmiseg_under", "Under"), tone: "normal" },
    { to: 25, label: t("rd.bmiseg_healthy", "Healthy"), tone: "good" },
    { to: 30, label: t("rd.bmiseg_over", "Over"), tone: "normal" },
    { to: 40, label: t("rd.bmiseg_obese", "Obese"), tone: "alert" },
  ];
  const bfSegments = [
    { to: 8, label: t("rd.bf_essential", "Essential"), tone: "alert" },
    { to: 14, label: t("rd.bf_athletic", "Athletic"), tone: "good" },
    { to: 18, label: t("rd.bf_fitness", "Fitness"), tone: "good" },
    { to: 25, label: t("rd.bf_average", "Average"), tone: "normal" },
    { to: 32, label: t("rd.bf_high", "High"), tone: "alert" },
  ];
  const whrSegments = [
    { to: 0.90, label: t("rd.whrseg_low", "Low"), tone: "good" },
    { to: 0.95, label: t("rd.whrseg_moderate", "Moderate"), tone: "normal" },
    { to: 1.05, label: t("rd.whrseg_high", "High"), tone: "alert" },
  ];

  const bmiStages = [
    { key: "under", label: t("rd.bmi_under", "Underweight"), sub: "<18.5", scaleX: 0.82, img: "/stages/bmi-under.webp" },
    { key: "healthy", label: t("rd.bmi_healthy", "Healthy"), sub: "18.5–25", scaleX: 0.98, img: "/stages/bmi-healthy.webp" },
    { key: "over", label: t("rd.bmi_over", "Overweight"), sub: "25–30", scaleX: 1.14, img: "/stages/bmi-over.webp" },
    { key: "obese", label: t("rd.bmi_obese", "Obese"), sub: "30+", scaleX: 1.30, img: "/stages/bmi-obese.webp" },
  ];
  const bfStages = [
    { key: "essential", label: t("rd.bf_essential", "Essential"), sub: "2–8%", scaleX: 0.80, img: "/stages/bodyfat-essential.webp" },
    { key: "athletic", label: t("rd.bf_athletic", "Athletic"), sub: "8–14%", scaleX: 0.90, img: "/stages/bodyfat-athletic.webp" },
    { key: "fitness", label: t("rd.bf_fitness", "Fitness"), sub: "14–18%", scaleX: 1.00, img: "/stages/bodyfat-fitness.webp" },
    { key: "average", label: t("rd.bf_average", "Average"), sub: "18–25%", scaleX: 1.12, img: "/stages/bodyfat-average.webp" },
    { key: "high", label: t("rd.bf_high", "High"), sub: "25%+", scaleX: 1.26, img: "/stages/bodyfat-high.webp" },
  ];
  const whrStages = [
    { key: "low", label: t("rd.whr_low", "Low risk"), sub: "<0.90", scaleX: 0.92, img: "/stages/whr-low.webp" },
    { key: "moderate", label: t("rd.whr_moderate", "Moderate"), sub: "0.90–0.95", scaleX: 1.08, img: "/stages/whr-moderate.webp" },
    { key: "high", label: t("rd.whr_high", "High risk"), sub: "0.95+", scaleX: 1.24, img: "/stages/whr-high.webp" },
  ];

  const products = [
    { name: "Rebuild Strength", icon: "dumbbell", grad: "#2F2F2B, #9B8573", condition: t("rd.prod1_condition", "Athlete recovery"), why: t("rd.prod1_why", "Post-workout recovery formula with BCAAs. Matched to your exercise frequency of 4–5 days/week."), dose: t("rd.prod1_dose", "1 scoop"), timing: t("rd.prod1_timing", "Post workout") },
    { name: "Phyto Complete", icon: "leaf", grad: "#8D9A84, #2F2F2B", condition: t("rd.prod2_condition", "Belly fat"), why: t("rd.prod2_why", "Plant-based meal replacement designed to support weight management and reduce abdominal fat."), dose: t("rd.prod2_dose", "1 serving"), timing: t("rd.prod2_timing", "Lunch swap") },
    { name: "HerbalifeLine Max", icon: "droplet", grad: "#6B5B4B, #C7A977", condition: t("rd.prod3_condition", "Cholesterol"), why: t("rd.prod3_why", "Omega-3 EPA+DHA supplement supporting cardiovascular health and healthy cholesterol levels."), dose: t("rd.prod3_dose", "1 softgel"), timing: t("rd.prod3_timing", "With breakfast") },
  ];

  const radarData = [
    { label: t("rd.radar_compos", "Compos."), ...d.radarData[0] },
    { label: t("rd.radar_weight", "Weight"), ...d.radarData[1] },
    { label: t("rd.radar_hydra", "Hydra."), ...d.radarData[2] },
    { label: t("rd.radar_caloric", "Caloric"), ...d.radarData[3] },
    { label: t("rd.radar_muscle", "Muscle"), ...d.radarData[4] },
    { label: t("rd.radar_cardio", "Cardio"), ...d.radarData[5] },
  ];

  const risks = [
    { tone: "good", label: t("rd.risk_strength", "STRENGTH"), note: t("rd.risk_strength_note", "Lean mass up 0.8 kg. Deficit is sparing muscle.") },
    { tone: "normal", label: t("rd.risk_watch", "WATCH"), note: t("rd.risk_watch_note", "Hydration at 56% — below the 60% ideal.") },
    { tone: "alert", label: t("rd.risk_action", "ACTION"), note: t("rd.risk_action_note", "WHR at upper edge. Anterior fat pattern.") },
  ];

  const compRows = [
    { c: "#8D9A84", k: t("rd.comp_lean", "Lean"), pct: d.lbmPct, kg: d.lbmKg, chip: "+0.8 kg" },
    { c: "#9B8573", k: t("rd.comp_fat", "Fat"), pct: d.bodyFat, kg: fatKg, chip: null },
  ];

  const calorieParts = [
    { dot: "rgba(255,255,255,0.55)", label: t("rd.bmr_at_rest", "BMR · at rest"), value: d.bmr.toLocaleString(), unit: t("rd.kcal", "kcal") },
    { dot: "#C7A977", label: t("rd.activity", "Activity"), value: `+${d.activity}`, unit: t("rd.kcal", "kcal") },
    { dot: "rgba(216,69,91,0.7)", label: t("rd.deficit", "Deficit"), value: `−${d.deficit}`, unit: t("rd.kcal", "kcal") },
  ];

  const macroCols = [
    { key: t("rd.protein", "Protein"), g: d.macros.protein.g, color: "var(--primary-hex, #9B8573)" },
    { key: t("rd.carbs", "Carbs"), g: d.macros.carbs.g, color: "var(--status-normal-hex, #C7A977)" },
    { key: t("rd.fats", "Fats"), g: d.macros.fats.g, color: "var(--sky, #C7A977)" },
  ];

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen" style={{ background: "#F4EFE7", fontFamily: "var(--font-inter)" }}>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden text-center" style={{ padding: "120px 56px 80px", background: "radial-gradient(ellipse at 50% -10%, rgba(155,133,115,0.06), transparent 50%), #F4EFE7" }}>
          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-20 h-px" style={{ background: "var(--ink)", opacity: 0.4 }} />
          <div className="relative max-w-[920px] mx-auto">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
              {t("rd.hero_brand", "EVALUACIÓN CORPORAL")} · {t("rd.hero_date", "14 MAY 2026")}
            </div>
            <h1 className="mt-10 text-[clamp(64px,10vw,120px)] leading-[0.95] tracking-[-0.045em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "var(--ink)" }}>
              {d.user.firstName} <span style={{ fontStyle: "italic", fontWeight: 400 }}>{d.user.lastName}.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-[44ch] text-lg leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {t("rd.hero_subtitle", "Your body assessment — a snapshot of where you stand today. Read it once, then let the plan do the work.")}
            </p>

            {/* Meta strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 mt-16 py-7" style={{ borderTop: "1px solid var(--border-hex)", borderBottom: "1px solid var(--border-hex)" }}>
              {meta.map((m, i, arr) => (
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
        <ChapterBand eyebrow={t("rd.ch_metrics_eyebrow", "BODY METRICS")} title={t("rd.ch_metrics_title", "Where your body sits today.")} />

        <section className="py-20 sm:py-24" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            {/* Row 1: BMI + Body Fat */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader title={t("rd.bmi_title", "Body Mass Index")} action={t("rd.bmi_action", "WHO reference")} />
                <LinearRange value={d.bmi} min={15} max={40} segments={bmiSegments} unit={t("rd.unit_bmi", "kg / m²")} caption={t("rd.bmi_range_caption", "Sits 0.9 above the healthy ceiling. Lean mass explains most of that — composition reads cleaner than BMI alone.")} />
                <StageStrip stages={bmiStages} activeKey={PICK.bmi(d.bmi)} caption={t("rd.bmi_spectrum_caption", "BMI maps weight to height only — it can't see muscle. The silhouettes show the broad external shape each band tends to produce.")} />
              </Card>
              <Card>
                <CardHeader title={t("rd.bf_title", "Body Fat")} action={t("rd.bf_action", "Male · {{age}} years", { age: d.user.age })} />
                <LinearRange value={d.bodyFat} min={5} max={32} segments={bfSegments} unit={t("rd.unit_percent", "percent")} caption={t("rd.bf_range_caption", "Comfortable inside the fitness band. Trending down from last assessment.")} />
                <StageStrip stages={bfStages} activeKey={PICK.bodyFat(d.bodyFat)} caption={t("rd.bf_spectrum_caption", "You read in the Fitness band — visible tone without extremes. The figures show the typical external look across the male body-fat range.")} />
              </Card>
            </div>

            {/* Row 2: WHR + Weight */}
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-4 mb-4">
              <Card>
                <CardHeader title={t("rd.whr_title", "Waist-to-Hip Ratio")} action={t("rd.whr_action", "Cardiometabolic risk")} />
                <LinearRange value={d.whr} min={0.75} max={1.05} segments={whrSegments} unit={t("rd.unit_ratio", "ratio")} decimals={2} caption={t("rd.whr_range_caption", "Low risk range. Anterior fat pattern accounts for the position; mobility work helps.")} />
                <StageStrip stages={whrStages} activeKey={PICK.whr(d.whr)} caption={t("rd.whr_spectrum_caption", "Waist-to-hip ratio reflects where fat sits. Lower ratios carry less cardiometabolic risk; the shapes show low, moderate and high distribution.")} />
              </Card>
              <Card>
                <CardHeader title={t("rd.weight_title", "Weight Analysis")} action={t("rd.weight_action", "Lorentz healthy band")} />
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.delta_to_goal", "DELTA TO GOAL")}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[72px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>−{d.weightDelta}</span>
                      <span className="text-lg" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_kg", "kg")}</span>
                    </div>
                    <div className="text-[11px] mt-2" style={{ color: "var(--muted-fg)" }}>{t("rd.weeks_at_rate", "~12 weeks at the current rate")}</div>
                  </div>
                  {/* Weight scale bar */}
                  <div>
                    <div className="relative h-1.5 rounded-full" style={{ background: "rgba(47,47,43,0.04)" }}>
                      <div className="absolute top-0 h-full rounded-full" style={{ left: `${((d.healthyRange[0] - 60) / 30) * 100}%`, width: `${((d.healthyRange[1] - d.healthyRange[0]) / 30) * 100}%`, background: "rgba(46,139,107,0.18)" }} />
                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2" style={{ left: `${((d.weight - 60) / 30) * 100}%`, transform: "translate(-50%, -50%)", borderColor: "var(--primary-hex)" }} />
                    </div>
                    <div className="flex justify-between mt-3 text-[11px]" style={{ color: "var(--muted-fg)" }}>
                      <span>{t("rd.current", "Current")}: <strong style={{ color: "var(--ink)" }}>{d.weight} {t("rd.unit_kg", "kg")}</strong></span>
                      <span>{t("rd.goal", "Goal")}: <strong style={{ color: "var(--ink)" }}>{d.weightGoal} {t("rd.unit_kg", "kg")}</strong></span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded-sm" style={{ background: "rgba(46,139,107,0.18)" }} />
                        {t("rd.healthy_band", "Healthy {{min}}–{{max}} kg", { min: d.healthyRange[0], max: d.healthyRange[1] })}
                      </span>
                    </div>
                  </div>
                  {/* Projected path over time */}
                  <div className="pt-6" style={{ borderTop: "1px dashed var(--border-hex)" }}>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: "var(--muted-fg)" }}>{t("rd.projected_path", "PROJECTED PATH")}</div>
                    <WeightTrajectory start={d.weight} goal={d.weightGoal} weeks={12} healthyCeil={d.healthyRange[1]} />
                  </div>
                  {/* Supporting figures */}
                  <div className="grid grid-cols-3 gap-3 pt-5" style={{ borderTop: "1px dashed var(--border-hex)" }}>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.to_lose", "To lose")}</div>
                      <div className="text-[22px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{d.weightDelta}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_kg", "kg")}</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.weekly_rate", "Weekly rate")}</div>
                      <div className="text-[22px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>~{(d.weightDelta / 12).toFixed(1)}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_kg_wk", "kg/wk")}</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.bmi_at_goal", "BMI at goal")}</div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{bmiGoal}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAEFE6", color: "#1F6B50" }}>{t("rd.healthy_tag", "Healthy")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 3: Composition + TBW */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="flex flex-col">
                <CardHeader title={t("rd.comp_title", "Body Composition")} action={t("rd.comp_action", "Lean vs fat")} />
                <div className="flex-1 flex items-center gap-7 py-1">
                  <div className="shrink-0" style={{ width: 132, height: 132 }}>
                    <CompositionRing leanPct={d.lbmPct} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="grid items-center gap-x-3 gap-y-3.5" style={{ gridTemplateColumns: "1fr auto 56px 58px" }}>
                      {compRows.flatMap(r => [
                        <div key={r.k + "-l"} className="flex items-center gap-2.5 text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.c }} />{r.k}
                        </div>,
                        <div key={r.k + "-p"} className="text-[17px] font-semibold text-right" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{r.pct}%</div>,
                        <div key={r.k + "-k"} className="text-[12px] text-right" style={{ color: "var(--muted-fg)" }}>{r.kg} {t("rd.unit_kg", "kg")}</div>,
                        <div key={r.k + "-c"} className="text-right">
                          {r.chip && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "#EAEFE6", color: "#1F6B50" }}>{r.chip}</span>}
                        </div>,
                      ])}
                    </div>
                    <p className="text-[11px] mt-4 pt-3" style={{ color: "var(--muted-fg)", borderTop: "1px dashed var(--border-hex)" }}>
                      {t("rd.comp_water_note", "of which body water {{pct}}% · part of lean mass", { pct: d.tbwPct })}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed mt-6" style={{ color: "var(--muted-fg)" }}>{t("rd.comp_caption", "Lean mass up 0.8 kg since last assessment — the deficit is sparing muscle.")}</p>
              </Card>
              <Card className="flex flex-col">
                <CardHeader title={t("rd.tbw_title", "Total Body Water")} action={t("rd.tbw_action", "Hydration share")} />
                <div className="flex-1 flex items-center gap-7 py-1">
                  <HydrationColumn pct={d.tbwPct} ideal={60} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[48px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{d.tbwPct}</span>
                      <span className="text-base" style={{ color: "var(--muted-fg)" }}>%</span>
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] mt-1.5" style={{ color: "var(--muted-fg)" }}>{t("rd.body_water", "BODY WATER")}</div>
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{d.tbwL}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_l", "L")}</span></span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EFDDD5", color: "#A22A3D" }}>−1.2 {t("rd.unit_l", "L")}</span>
                    </div>
                    <div className="grid items-center gap-x-3 gap-y-2 mt-5 pt-3 text-[12px]" style={{ gridTemplateColumns: "auto 1fr auto", borderTop: "1px dashed var(--border-hex)" }}>
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#C7A977" }} />
                      <span style={{ color: "var(--ink)" }}>{t("rd.now", "Now")}</span>
                      <span className="font-semibold text-right" style={{ color: "var(--ink)" }}>{d.tbwPct}%</span>
                      <span className="inline-block w-2.5 border-t border-dashed" style={{ borderColor: "rgba(47,47,43,0.45)" }} />
                      <span style={{ color: "var(--ink)" }}>{t("rd.ideal", "Ideal")}</span>
                      <span className="font-semibold text-right" style={{ color: "var(--ink)" }}>60%</span>
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed mt-6" style={{ color: "var(--muted-fg)" }}>{t("rd.tbw_caption", "Below the 60% reference. Daily intake target raised to 2.5 L.")}</p>
              </Card>
            </div>
          </div>
        </section>

        {/* ── CHAPTER: ENERGY & NUTRITION ── */}
        <ChapterBand eyebrow={t("rd.ch_energy_eyebrow", "ENERGY & NUTRITION")} title={t("rd.ch_energy_title", "What your body needs from here.")} />

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
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.7)" }}>{t("rd.daily_energy", "Daily energy")}</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(199,169,119,0.16)", color: "#C7A977" }}>
                      {t("rd.cal_goal", "Goal · Weight control")}
                    </span>
                  </div>
                  <div className="text-[clamp(80px,12vw,140px)] leading-none font-semibold mt-6" style={{ fontFamily: "var(--font-inter)" }}>
                    {d.calories.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{t("rd.kcal_per_day", "kilocalories · per day")}</div>
                </div>
                <div className="relative mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="flex h-1.5 rounded-full overflow-hidden mb-5 gap-0.5">
                    <div style={{ flex: d.bmr, background: "rgba(255,255,255,0.55)" }} />
                    <div style={{ flex: d.activity, background: "#C7A977" }} />
                    <div style={{ flex: d.deficit, background: "rgba(216,69,91,0.7)" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {calorieParts.map(s => (
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
                  <CardHeader title={t("rd.macro_title", "Macro Split")} action={t("rd.macro_action", "Per day")} />
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.featured_protein", "FEATURED · DAILY PROTEIN")}</div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-[72px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>{d.macros.protein.g}</span>
                    <span className="text-xl" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_g", "g")}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed mt-3 max-w-[34ch]" style={{ color: "var(--muted-fg)" }}>
                    {t("rd.macro_desc", "Calibrated to your lean mass. Holds muscle through the deficit; carbs and fats fill the remainder.")}
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
                    {macroCols.map(m => (
                      <div key={m.key} className="pt-2.5" style={{ borderTop: `2px solid ${m.color}` }}>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{m.key}</div>
                        <div className="text-[26px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>
                          {m.g}<span className="text-[13px] ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_g", "g")}</span>
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
                  <CardHeader title={t("rd.rec_title", "Recommended")} action={t("rd.rec_action", "3 picks · tied to signals")} />
                  <h3 className="text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.028em] mt-2" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                    {t("rd.rec_headline_1", "Three items.")}<br />
                    <span style={{ fontStyle: "italic", color: "var(--primary-hex, #9B8573)" }}>{t("rd.rec_headline_2", "One reason each.")}</span>
                  </h3>
                </div>
                <p className="text-[14.5px] leading-relaxed pb-1.5" style={{ color: "var(--muted-fg)", maxWidth: "44ch" }}>
                  {t("rd.rec_lede", "Each item is tied to a specific signal in your assessment. If the signal isn't yours, the item isn't either.")}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p, i) => (
                  <Card key={i} className="flex flex-col">
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px dashed var(--border-hex)" }}>
                      <div className="w-11 h-11 rounded-[11px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.grad})` }}>
                        <Icon name={p.icon} size={18} color="white" />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--primary-hex, #9B8573)" }}>
                        {t("rd.for_prefix", "FOR")} · {p.condition.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-[26px] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>{p.name}</h4>
                    <p className="text-[13.5px] leading-relaxed mt-3 flex-1" style={{ color: "var(--muted-fg)" }}>{p.why}</p>
                    <div className="grid grid-cols-2 gap-2 mt-6 pt-4" style={{ borderTop: "1px solid var(--border-hex)" }}>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.dose", "DOSE")}</div>
                        <div className="text-[13px] font-semibold mt-1" style={{ color: "var(--ink)" }}>{p.dose}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.timing", "TIMING")}</div>
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
        <ChapterBand eyebrow={t("rd.ch_health_eyebrow", "HEALTH OVERVIEW")} title={t("rd.ch_health_title", "The full picture, at a glance.")} />

        <section className="py-20 sm:py-24" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            {/* Risk callouts */}
            <div className="grid sm:grid-cols-3 gap-3 mb-12">
              {risks.map((r, i) => (
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
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ink)" }}>{t("rd.profile_title", "Profile")}</span>
                  <div className="flex gap-4 text-[11px]" style={{ color: "var(--muted-fg)" }}>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: "var(--primary-hex)" }} />{t("rd.current", "Current")}</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: "rgba(47,47,43,0.35)" }} />{t("rd.previous", "Previous")}</span>
                  </div>
                </div>
                <div className="flex-1 flex justify-center items-center">
                  <Radar data={radarData} />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-5" style={{ borderTop: "1px dashed var(--border-hex)" }}>
                  {radarData.map(r => {
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
                <CardHeader title={t("rd.summary_title", "Summary")} />
                <h3 className="text-[clamp(28px,3vw,36px)] leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                  <span style={{ fontStyle: "italic" }}>{d.user.firstName}</span> —
                </h3>
                <div className="mt-6 text-[15px] leading-[1.7] flex flex-col gap-5" style={{ color: "var(--ink)" }}>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>{t("rd.summary_working_label", "What's working.")}</strong>{" "}
                    {t("rd.summary_working", "Body fat is in the fitness band and lean mass added 0.8 kg. The deficit isn't eating your muscle.")}
                  </p>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>{t("rd.summary_drifting_label", "What's drifting.")}</strong>{" "}
                    {t("rd.summary_drifting", "Hydration sits at 1.2 L average against a 2.5 L target. Total body water reads 56% — below ideal.")}
                  </p>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>{t("rd.summary_week_label", "This week.")}</strong>{" "}
                    {t("rd.summary_week", "One swap, one habit. Trade Tuesday's pasta for grilled fish and greens; add a 12:30 hydration reminder.")}
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
                <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "#C7A977" }}>{t("rd.next_assessment", "NEXT ASSESSMENT")}</div>
                <h3 className="mt-4 text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.028em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                  {t("rd.book_followup", "Book your follow-up for")} <span style={{ fontStyle: "italic", color: "#C7A977" }}>{t("rd.followup_date", "11 June")}</span>.
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed max-w-[52ch]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t("rd.cta_body", "Four weeks gives the plan time to bend the trend lines. We'll compare side-by-side and rebuild the next phase from actual results.")}
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                <Link href="/" className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium" style={{ background: "white", color: "var(--ink)" }}>
                  {t("rd.back_home", "Back to home")} <Icon name="arrow" size={14} color="var(--ink)" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium" style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}>
                  <Icon name="download" size={13} color="white" /> {t("rd.download_report", "Download report")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="px-5 sm:px-8 pb-12" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto rounded-[14px] border p-4 flex items-start gap-3 text-xs leading-relaxed" style={{ borderColor: "var(--border-hex)", background: "white", color: "var(--muted-fg)" }}>
            <span className="shrink-0 mt-0.5">⚕</span>
            <span><strong style={{ color: "var(--ink)" }}>{t("rd.disclaimer_title", "Health assessment · not medical advice.")}</strong> {t("rd.disclaimer_body", "Body composition and metrics are estimates based on published formulas. Consult a healthcare professional for diagnosis.")}</span>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
