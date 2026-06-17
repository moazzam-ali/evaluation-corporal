"use client";

import { useTranslation } from "react-i18next";

/* ── Active-stage pickers (numeric only; labels live in the component) ── */
export const PICK = {
  bmi: (v) => (v < 18.5 ? "under" : v < 25 ? "healthy" : v < 30 ? "over" : "obese"),
  bodyFat: (v) => (v <= 8 ? "essential" : v <= 14 ? "athletic" : v <= 18 ? "fitness" : v <= 25 ? "average" : "high"),
  whr: (v) => (v <= 0.9 ? "low" : v <= 0.95 ? "moderate" : "high"),
};

/* ── Tone colors ───────────────────────────────────────────────── */
export const TONES = {
  good:   { fill: "#8D9A84", soft: "rgba(46,139,107,0.12)",  chip: "#EAEFE6", text: "#1F6B50" },
  normal: { fill: "#C7A977", soft: "rgba(198,138,46,0.10)",  chip: "#F5EBD5", text: "#8E6418" },
  alert:  { fill: "#9C5A4A", soft: "rgba(216,69,91,0.10)",   chip: "#EFDDD5", text: "#A22A3D" },
};

/* ── Icon ──────────────────────────────────────────────────────── */
export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6 }) {
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
export function LinearRange({ value, min, max, segments, unit, caption, decimals = 1 }) {
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
export function Card({ children, dark, className = "", style: extraStyle }) {
  return (
    <div className={`rounded-[20px] ${className}`} style={{
      background: dark ? "var(--ink)" : "white",
      color: dark ? "white" : "var(--ink)",
      border: dark ? "none" : "1px solid var(--border-hex, #E4D9C6)",
      padding: "26px 30px 28px",
      boxShadow: dark ? "var(--shadow-md)" : "var(--shadow-xs)",
      ...extraStyle,
    }}>{children}</div>
  );
}

export function CardHeader({ title, action }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-5">
      <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ink)" }}>{title}</span>
      {action && <span className="text-[11px]" style={{ color: "var(--muted-fg)", letterSpacing: "0.04em" }}>{action}</span>}
    </div>
  );
}

/* ── Chapter Band ──────────────────────────────────────────────── */
export function ChapterBand({ eyebrow, title }) {
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
export function Radar({ data }) {
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
export function CompositionRing({ leanPct }) {
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
export function HydrationColumn({ pct, ideal = 60, min = 40, max = 70 }) {
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
export function WeightTrajectory({ start, goal, weeks = 12, healthyCeil }) {
  const { t } = useTranslation();
  const xL = 30, xR = 330, yT = 16, yB = 104;
  const wTop = Math.max(start, healthyCeil) + 1;
  const wBot = goal - 1;
  const X = (wk) => xL + (wk / weeks) * (xR - xL);
  const Y = (w) => yT + ((wTop - w) / (wTop - wBot)) * (yB - yT);
  const ss = (tt) => tt * tt * (3 - 2 * tt);
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
