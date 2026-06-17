"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import StageStrip from "@/components/StageStrip/StageStrip";
import {
  PICK, TONES, Icon,
  LinearRange, Card, CardHeader, ChapterBand,
  Radar, CompositionRing, HydrationColumn, WeightTrajectory,
} from "@/components/results/ResultsCharts";

/* ── Product normalizer: API enriched_products → card display shape ── */
const ICON_MAP = { ingestible: "dumbbell", topical: "droplet" };
const GRAD_MAP = { ingestible: "#2F2F2B, #9B8573", topical: "#8D9A84, #2F2F2B" };

function normalizeProduct(p) {
  if (p.icon && p.grad) return p;
  return {
    name: p.name || p.id,
    icon: ICON_MAP[p.type] || "leaf",
    grad: GRAD_MAP[p.type] || "#6B5B4B, #C7A977",
    condition: p.concernCategory || p.category || "",
    why: p.reason || "",
    howToUse: p.howToUse || "",
    image: p.image || null,
  };
}

/* ── Risk callouts: generated from metric scores ── */
function generateRisks(metrics, t) {
  if (!metrics?.length) return [];
  const KEY_IDS = ["bmi", "body_fat", "waist_hip_ratio", "hydration_target", "lean_mass", "total_body_water"];
  const keyMetrics = metrics.filter((m) => KEY_IDS.includes(m.id));
  const sorted = [...keyMetrics].sort((a, b) => a.score - b.score);

  const risks = [];
  const best = sorted[sorted.length - 1];
  if (best?.score >= 60) {
    risks.push({ tone: "good", label: t("rd.risk_strength", "STRENGTH"), note: best.insight || t("rd.risk_strength_fallback", "Your strongest metric is performing well.") });
  }
  const mid = sorted.find((m) => m.score >= 40 && m.score < 70);
  if (mid) {
    risks.push({ tone: "normal", label: t("rd.risk_watch", "WATCH"), note: mid.insight || t("rd.risk_watch_fallback", "This area could use some attention.") });
  }
  const worst = sorted[0];
  if (worst?.score < 70) {
    risks.push({ tone: "alert", label: t("rd.risk_action", "ACTION"), note: worst.insight || t("rd.risk_action_fallback", "This metric needs focused improvement.") });
  }
  return risks;
}

/**
 * @param {{ data, products, insights, tips, summary, metrics, createdAt }} props
 *   data      — flat view-model (DEMO shape) from mapResultsToView or hardcoded DEMO
 *   products  — array of product objects (demo shape OR enriched_products from API)
 *   insights  — array of { category, title, points } from analysis
 *   tips      — array of tip strings from analysis
 *   summary   — AI summary string
 *   metrics   — raw metrics array (for risk callout generation)
 *   createdAt — ISO date string for the hero
 */
export default function BodyResultsTemplate({ data, products = [], insights = [], tips = [], summary = "", metrics = [], createdAt }) {
  const { t, i18n } = useTranslation();
  const d = data;

  const bmiGoal = d.user.height > 0 ? (d.weightGoal / (d.user.height / 100) ** 2).toFixed(1) : "—";
  const fatKg = (d.weight * d.bodyFat / 100).toFixed(1);

  const heroDate = createdAt
    ? new Date(createdAt).toLocaleDateString(i18n.language || "en", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()
    : new Date().toLocaleDateString(i18n.language || "en", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();

  const meta = [
    { l: t("rd.meta_age", "Age"), v: d.user.age, u: t("rd.unit_years", "years") },
    { l: t("rd.meta_height", "Height"), v: d.user.height, u: t("rd.unit_cm", "cm") },
    { l: t("rd.meta_weight", "Weight"), v: d.user.weight, u: t("rd.unit_kg", "kg") },
    ...(d.user.metabolicAge != null ? [{
      l: t("rd.meta_metabolic", "Metabolic age"), v: d.user.metabolicAge, u: t("rd.unit_years", "years"),
      note: d.user.age != null && d.user.metabolicAge < d.user.age
        ? t("rd.metabolic_note", "{{n}} yrs younger", { n: d.user.age - d.user.metabolicAge })
        : null,
    }] : []),
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

  const normalizedProducts = products.map(normalizeProduct);

  const radarData = [
    { label: t("rd.radar_compos", "Compos."), ...d.radarData[0] },
    { label: t("rd.radar_weight", "Weight"), ...d.radarData[1] },
    { label: t("rd.radar_hydra", "Hydra."), ...d.radarData[2] },
    { label: t("rd.radar_caloric", "Caloric"), ...d.radarData[3] },
    { label: t("rd.radar_muscle", "Muscle"), ...d.radarData[4] },
    { label: t("rd.radar_cardio", "Cardio"), ...d.radarData[5] },
  ];

  const risks = metrics.length > 0 ? generateRisks(metrics, t) : (data._demoRisks || []);

  const compRows = [
    { c: "#8D9A84", k: t("rd.comp_lean", "Lean"), pct: d.lbmPct, kg: d.lbmKg, chip: null },
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

  // Coach note content — from insights/tips or fallback to summary
  const strengthsInsight = insights.find((i) => i.category === "strengths");
  const concernsInsight = insights.find((i) => i.category === "concerns");
  const goalsInsight = insights.find((i) => i.category === "goals");
  const coachWorking = strengthsInsight?.points?.[0] || summary || t("rd.summary_working", "Body fat is in the fitness band and lean mass added 0.8 kg. The deficit isn't eating your muscle.");
  const coachDrifting = concernsInsight?.points?.[0] || t("rd.summary_drifting", "Hydration sits at 1.2 L average against a 2.5 L target. Total body water reads 56% — below ideal.");
  const coachWeek = tips?.[0] || goalsInsight?.points?.[0] || t("rd.summary_week", "One swap, one habit. Trade Tuesday's pasta for grilled fish and greens; add a 12:30 hydration reminder.");

  const sexLabel = d.sex === "female" ? t("rd.female", "Female") : t("rd.male", "Male");

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen" style={{ background: "#F4EFE7", fontFamily: "var(--font-inter)" }}>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden text-center" style={{ padding: "120px 56px 80px", background: "radial-gradient(ellipse at 50% -10%, rgba(155,133,115,0.06), transparent 50%), #F4EFE7" }}>
          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-20 h-px" style={{ background: "var(--ink)", opacity: 0.4 }} />
          <div className="relative max-w-[920px] mx-auto">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
              {t("rd.hero_brand", "EVALUACIÓN CORPORAL")} · {heroDate}
            </div>
            <h1 className="mt-10 text-[clamp(64px,10vw,120px)] leading-[0.95] tracking-[-0.045em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 300, color: "var(--ink)" }}>
              {d.user.firstName} <span style={{ fontStyle: "italic", fontWeight: 400 }}>{d.user.lastName}.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-[44ch] text-lg leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {t("rd.hero_subtitle", "Your body assessment — a snapshot of where you stand today. Read it once, then let the plan do the work.")}
            </p>

            {/* Meta strip */}
            <div className={`grid ${meta.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} mt-16 py-7`} style={{ borderTop: "1px solid var(--border-hex)", borderBottom: "1px solid var(--border-hex)" }}>
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
                <CardHeader title={t("rd.bf_title", "Body Fat")} action={t("rd.bf_action_dynamic", "{{sex}} · {{age}} years", { sex: sexLabel, age: d.user.age })} />
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
                    {d.deficit > 0 && <div style={{ flex: d.deficit, background: "rgba(216,69,91,0.7)" }} />}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {calorieParts.filter((_, i) => i < 2 || d.deficit > 0).map(s => (
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
            {normalizedProducts.length > 0 && (
              <div className="mt-12">
                <div className="grid md:grid-cols-2 gap-12 items-end mb-9">
                  <div>
                    <CardHeader title={t("rd.rec_title", "Recommended")} action={t("rd.rec_action_dynamic", "{{n}} picks · tied to signals", { n: normalizedProducts.length })} />
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
                  {normalizedProducts.map((p, i) => (
                    <Card key={i} className="flex flex-col">
                      <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px dashed var(--border-hex)" }}>
                        {p.image ? (
                          <div className="w-11 h-11 rounded-[11px] overflow-hidden flex items-center justify-center" style={{ background: "#F4EFE7" }}>
                            <img src={p.image} alt="" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-[11px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.grad})` }}>
                            <Icon name={p.icon} size={18} color="white" />
                          </div>
                        )}
                        <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--primary-hex, #9B8573)" }}>
                          {t("rd.for_prefix", "FOR")} · {(p.condition || "").toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-[26px] tracking-[-0.02em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>{p.name}</h4>
                      <p className="text-[13.5px] leading-relaxed mt-3 flex-1" style={{ color: "var(--muted-fg)" }}>{p.why}</p>
                      {(p.dose || p.timing || p.howToUse) && (
                        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-hex)" }}>
                          {p.dose && p.timing ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.dose", "DOSE")}</div>
                                <div className="text-[13px] font-semibold mt-1" style={{ color: "var(--ink)" }}>{p.dose}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.timing", "TIMING")}</div>
                                <div className="text-[13px] font-semibold mt-1" style={{ color: "var(--ink)" }}>{p.timing}</div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.how_to_use", "HOW TO USE")}</div>
                              <div className="text-[13px] font-semibold mt-1" style={{ color: "var(--ink)" }}>{p.howToUse}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── CHAPTER: HEALTH OVERVIEW ── */}
        <ChapterBand eyebrow={t("rd.ch_health_eyebrow", "HEALTH OVERVIEW")} title={t("rd.ch_health_title", "The full picture, at a glance.")} />

        <section className="py-20 sm:py-24" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            {/* Risk callouts */}
            {risks.length > 0 && (
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
            )}

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
                    {coachWorking}
                  </p>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>{t("rd.summary_drifting_label", "What's drifting.")}</strong>{" "}
                    {coachDrifting}
                  </p>
                  <p>
                    <strong style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>{t("rd.summary_week_label", "This week.")}</strong>{" "}
                    {coachWeek}
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
                <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "#C7A977" }}>{t("rd.cta_eyebrow", "WHAT'S NEXT")}</div>
                <h3 className="mt-4 text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.028em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                  {t("rd.cta_heading", "Follow the plan,")}{" "}
                  <span style={{ fontStyle: "italic", color: "#C7A977" }}>{t("rd.cta_heading_em", "reassess in 4 weeks.")}</span>
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed max-w-[52ch]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t("rd.cta_body_v2", "Give the plan time to move the numbers. Your coach will reach out when it's time for your next assessment — we'll compare side-by-side and adjust from there.")}
                </p>
              </div>
              <Link href="/" className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium" style={{ background: "white", color: "var(--ink)" }}>
                {t("rd.back_home", "Back to home")} <Icon name="arrow" size={14} color="var(--ink)" />
              </Link>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="px-5 sm:px-8 pb-12" style={{ background: "#F4EFE7" }}>
          <div className="max-w-[1180px] mx-auto rounded-[14px] border p-4 flex items-start gap-3 text-xs leading-relaxed" style={{ borderColor: "var(--border-hex)", background: "white", color: "var(--muted-fg)" }}>
            <span className="shrink-0 mt-0.5">&#x2695;</span>
            <span><strong style={{ color: "var(--ink)" }}>{t("rd.disclaimer_title", "Health assessment · not medical advice.")}</strong> {t("rd.disclaimer_body", "Body composition and metrics are estimates based on published formulas. Consult a healthcare professional for diagnosis.")}</span>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
