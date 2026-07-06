"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import StageStrip from "@/components/StageStrip/StageStrip";
import { useLightbox, ExpandIcon } from "@/components/Lightbox/Lightbox";
import {
  PICK, TONES, Icon, InfoHint,
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

/* ── Localized text for computed content ─────────────────────────
   Server-computed insights/tips are stored as { key, params, text } so the
   client renders them in the CURRENT UI language (old rows stored plain
   English strings — those pass through unchanged). Category enums resolve
   through rd.cat_<id>. */
function useLocText(t) {
  return (p) => {
    if (p == null) return "";
    if (typeof p === "string") return p;
    const params = { ...(p.params || {}) };
    if (params.cat) params.category = t(`rd.cat_${params.cat}`, String(params.cat).replace(/_/g, " "));
    return p.key ? t(`rd.${p.key}`, { ...params, defaultValue: p.text || "" }) : (p.text || "");
  };
}

/* Localized one-liner for a metric — used by the risk callouts instead of the
   stored (English) insight string. */
function metricNote(m, t) {
  const cat = m.category ? t(`rd.cat_${m.category}`, String(m.category).replace(/_/g, " ")) : "";
  switch (m.id) {
    case "bmi": return t("rd.ins_bmi", { value: m.value, category: cat, defaultValue: `BMI of ${m.value} — ${cat} range.` });
    case "body_fat": return t("rd.ins_bf", { value: m.value, category: cat, defaultValue: `Estimated body fat ${m.value}% — ${cat} for your age band.` });
    case "waist_hip_ratio": return t("rd.ins_whr", { value: m.value, category: cat, defaultValue: `Waist-to-hip ratio ${m.value} — ${cat} cardiometabolic risk band.` });
    case "hydration_target": return t("rd.ins_hydration", { value: m.value, defaultValue: `Daily hydration target ${m.value} L.` });
    case "lean_mass": return t("rd.ins_lean", { value: m.value, defaultValue: `Lean mass at ${m.value}% of body weight.` });
    case "total_body_water": return t("rd.ins_tbw", { value: m.value, defaultValue: `Total body water ${m.value} L.` });
    default: return null;
  }
}

/* ── Scan-card enum labels ─────────────────────────────────────────
   The vision read stores machine ids (English enums); these maps resolve
   them in the CURRENT UI language. Literal t() calls so the locale sync
   script picks every key up. */
function scanLabels(t) {
  return {
    fatDistribution: {
      android: t("rd.fatdist_android", "Abdomen-first (android)"),
      gynoid: t("rd.fatdist_gynoid", "Hips & thighs (gynoid)"),
      mixed: t("rd.fatdist_mixed", "Mixed pattern"),
      even: t("rd.fatdist_even", "Evenly distributed"),
    },
    muscleTone: {
      low: t("rd.tone_low", "Soft — low definition"),
      moderate: t("rd.tone_moderate", "Moderate definition"),
      defined: t("rd.tone_defined", "Defined"),
      athletic: t("rd.tone_athletic", "Athletic"),
    },
    symmetry: {
      balanced: t("rd.sym_balanced", "Balanced left–right"),
      slight_asymmetry: t("rd.sym_slight_asymmetry", "Slight asymmetry"),
      notable_asymmetry: t("rd.sym_notable_asymmetry", "Notable asymmetry"),
    },
    postureFlags: {
      neutral: t("rd.pf_neutral", "Neutral stance"),
      forward_head: t("rd.pf_forward_head", "Forward head"),
      rounded_shoulders: t("rd.pf_rounded_shoulders", "Rounded shoulders"),
      uneven_shoulders: t("rd.pf_uneven_shoulders", "Uneven shoulders"),
      anterior_pelvic_tilt: t("rd.pf_anterior_pelvic_tilt", "Anterior pelvic tilt"),
      posterior_pelvic_tilt: t("rd.pf_posterior_pelvic_tilt", "Posterior pelvic tilt"),
      lateral_lean: t("rd.pf_lateral_lean", "Lateral lean"),
    },
    focusAreas: {
      core: t("rd.focus_core", "Core & midsection"),
      upper_body: t("rd.focus_upper_body", "Upper body"),
      lower_body: t("rd.focus_lower_body", "Lower body"),
      posture: t("rd.focus_posture", "Posture"),
      symmetry: t("rd.focus_symmetry", "Left–right balance"),
      overall_conditioning: t("rd.focus_overall", "Overall conditioning"),
    },
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
    risks.push({ tone: "good", label: t("rd.risk_strength", "STRENGTH"), note: metricNote(best, t) || t("rd.risk_strength_fallback", "Your strongest metric is performing well.") });
  }
  const mid = sorted.find((m) => m.score >= 40 && m.score < 70);
  if (mid) {
    risks.push({ tone: "normal", label: t("rd.risk_watch", "WATCH"), note: metricNote(mid, t) || t("rd.risk_watch_fallback", "This area could use some attention.") });
  }
  const worst = sorted[0];
  if (worst?.score < 70) {
    risks.push({ tone: "alert", label: t("rd.risk_action", "ACTION"), note: metricNote(worst, t) || t("rd.risk_action_fallback", "This metric needs focused improvement.") });
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
export default function BodyResultsTemplate({ data, products = [], insights = [], tips = [], summary = "", metrics = [], createdAt, imageUrl = null, bodyType = null, postureNote = null, compositionNote = null, photoQualityNote = null, visionDetails = null, visionAvailable = false, answersHref = null }) {
  const { t, i18n } = useTranslation();
  const { open: openLightbox } = useLightbox();
  const d = data;
  const locText = useLocText(t);

  // Spectrum figures follow the sex selected on the form; the switcher lives
  // in the enlarged (lightbox) view so the cards stay clean on mobile.
  const [stageSex, setStageSex] = useState(d.sex === "female" ? "female" : "male");
  // Male set predates the atlas and lives under /stages; the female set was
  // added with the atlas under /atlas/external-female-*.
  const stageImgFor = (sex, metric, key) =>
    sex === "female" ? `/atlas/external-female-${metric}-${key}.webp` : `/stages/${metric}-${key}.webp`;
  const stageImg = (metric, key) => stageImgFor(stageSex, metric, key);
  const sexToggleFor = (metric, captionBySex = null) => ({
    value: stageSex,
    onChange: setStageSex,
    imgFor: (sex, key) => stageImgFor(sex, metric, key),
    captionBySex,
  });

  // Dynamic, localized band captions computed from the user's real values —
  // replaces the old static copy that claimed "0.9 above the ceiling" for everyone.
  const bmiCaption = d.bmi <= 0 ? "" :
    d.bmi < 18.5 ? t("rd.bmi_cap_under", { delta: (18.5 - d.bmi).toFixed(1) })
    : d.bmi < 25 ? t("rd.bmi_cap_in")
    : t("rd.bmi_cap_over", { delta: (d.bmi - 25).toFixed(1) });
  const bfCat = metrics.find((m) => m.id === "body_fat")?.category;
  const bfCaption = bfCat
    ? t(`rd.bf_cap_${bfCat}`, t("rd.bf_range_caption", "Estimated from BMI, age and sex (Deurenberg)."))
    : t("rd.bf_range_caption", "Estimated from BMI, age and sex (Deurenberg).");
  const whrCat = metrics.find((m) => m.id === "waist_hip_ratio")?.category;
  const whrCaption = whrCat
    ? t(`rd.whr_cap_${whrCat}`, t("rd.whr_range_caption", "Waist relative to hip — a proxy for where fat sits."))
    : t("rd.whr_range_caption", "Waist relative to hip — a proxy for where fat sits.");
  const tbwCaption = d.tbwPct >= 60
    ? t("rd.tbw_cap_ok", { pct: d.tbwPct })
    : t("rd.tbw_cap_below", { pct: d.tbwPct });

  // Goal delta sign follows the user's own goal (gain goals show +).
  const goalSign = d.weightGoal > d.weight ? "+" : "−";

  // ── Structured photo read (vision_details) — enum ids resolved to the
  //    current UI language via scanLabels; old rows without it just render
  //    the classic three-note card. ──
  const SCAN = scanLabels(t);
  const vd = visionDetails || {};
  const scanTraits = [
    visionAvailable && bodyType ? { label: t("rd.body_type_label", "Body type"), value: t(`results.body_types.${bodyType}`, bodyType) } : null,
    vd.fat_distribution ? { label: t("rd.fat_dist_label", "Fat distribution"), value: SCAN.fatDistribution[vd.fat_distribution] } : null,
    vd.muscle_tone ? { label: t("rd.muscle_tone_label", "Muscle tone"), value: SCAN.muscleTone[vd.muscle_tone] } : null,
    vd.symmetry ? { label: t("rd.symmetry_label", "Symmetry"), value: SCAN.symmetry[vd.symmetry] } : null,
  ].filter((x) => x && x.value);
  const postureFlags = (vd.posture_flags || []).map((f) => ({ id: f, label: SCAN.postureFlags[f] })).filter((f) => f.label);
  const focusAreas = (vd.focus_areas || []).map((f) => SCAN.focusAreas[f]).filter(Boolean);

  // Visual body-fat cross-check: the AI's from-photo range vs the Deurenberg
  // formula estimate. ±2 pts of slack before we call a disagreement.
  const vbf = vd.visual_body_fat || null;
  const vbfVerdict = vbf && d.bodyFat > 0
    ? (d.bodyFat >= vbf.low - 2 && d.bodyFat <= vbf.high + 2 ? "match" : d.bodyFat > vbf.high ? "leaner" : "fuller")
    : null;
  const vbfVerdictText =
    vbfVerdict === "match" ? t("rd.vbf_match", "In line with your formula estimate of {{value}}%", { value: d.bodyFat })
    : vbfVerdict === "leaner" ? t("rd.vbf_leaner", "The photo reads leaner than your formula estimate of {{value}}%", { value: d.bodyFat })
    : vbfVerdict === "fuller" ? t("rd.vbf_fuller", "The photo reads fuller than your formula estimate of {{value}}%", { value: d.bodyFat })
    : null;

  const openScan = () => openLightbox({
    title: t("rd.scan_title", "Your scan"),
    caption: t("rd.scan_caption", "Your uploaded photo, used for the AI body-composition read."),
    indicators: [
      ...scanTraits,
      vbf ? { label: t("rd.vbf_label", "Visual body-fat read"), value: `${vbf.low}–${vbf.high}%` } : null,
      postureFlags.length ? { label: t("rd.posture_label", "Posture"), value: postureFlags.map((f) => f.label).join(" · ") } : null,
      postureNote ? { label: t("rd.posture_note_label", "Posture note"), value: postureNote } : null,
      compositionNote ? { label: t("rd.composition_label", "Mass distribution"), value: compositionNote } : null,
      focusAreas.length ? { label: t("rd.focus_label", "Where to focus first"), value: focusAreas.join(" · ") } : null,
      photoQualityNote ? { label: t("rd.photo_note_label", "Photo note"), value: photoQualityNote } : null,
    ].filter(Boolean),
    items: [{ src: imageUrl }],
  });

  const openProduct = (p) => openLightbox({
    title: p.condition ? `${t("rd.for_prefix", "FOR")} · ${p.condition}` : "",
    caption: p.why,
    indicators: [
      p.dose ? { label: t("rd.dose", "DOSE"), value: p.dose } : null,
      p.timing ? { label: t("rd.timing", "TIMING"), value: p.timing } : null,
      p.howToUse && !(p.dose && p.timing) ? { label: t("rd.how_to_use", "HOW TO USE"), value: p.howToUse } : null,
    ].filter(Boolean),
    items: [{ src: p.image, label: p.name }],
  });

  const bmiGoalNum = d.user.height > 0 ? d.weightGoal / (d.user.height / 100) ** 2 : null;
  const bmiGoal = bmiGoalNum != null ? bmiGoalNum.toFixed(1) : "—";
  // BMI-at-goal chip reflects the band the goal actually lands in (the old
  // chip said "Healthy" no matter the number).
  const bmiGoalTag = bmiGoalNum == null ? null
    : bmiGoalNum < 18.5 ? { label: t("rd.bmiseg_under", "Under"), bg: "#F5EBD5", color: "#8E6418" }
    : bmiGoalNum < 25 ? { label: t("rd.healthy_tag", "Healthy"), bg: "#EAEFE6", color: "#1F6B50" }
    : bmiGoalNum < 30 ? { label: t("rd.bmiseg_over", "Over"), bg: "#F5EBD5", color: "#8E6418" }
    : { label: t("rd.bmiseg_obese", "Obese I"), bg: "#EFDDD5", color: "#A22A3D" };
  const fatKg = (d.weight * d.bodyFat / 100).toFixed(1);

  const heroDate = createdAt
    ? new Date(createdAt).toLocaleDateString(i18n.language || "en", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()
    : new Date().toLocaleDateString(i18n.language || "en", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();

  const meta = [
    { l: t("rd.meta_age", "Age"), v: d.user.age, u: t("rd.unit_years", "years") },
    { l: t("rd.meta_height", "Height"), v: d.user.height, u: t("rd.unit_cm", "cm") },
    { l: t("rd.meta_weight", "Weight"), v: d.user.weight, u: t("rd.unit_kg", "kg") },
    ...(d.user.metabolicAge != null ? [{
      l: t("rd.meta_metabolic", "Metabolic age"), v: d.user.metabolicAge, u: t("rd.unit_years", "years"), infoKey: "metabolic",
      note: d.user.age != null && d.user.metabolicAge < d.user.age
        ? t("rd.metabolic_note", "{{n}} yrs younger", { n: d.user.age - d.user.metabolicAge })
        : null,
    }] : []),
  ];

  const bmiSegments = [
    { to: 18.5, label: t("rd.bmiseg_under", "Under"), tone: "normal" },
    { to: 25, label: t("rd.bmiseg_healthy", "Healthy"), tone: "good" },
    { to: 30, label: t("rd.bmiseg_over", "Over"), tone: "normal" },
    { to: 35, label: t("rd.bmiseg_obese", "Obese I"), tone: "alert" },
    { to: 40, label: t("rd.bmiseg_obese2", "Obese II+"), tone: "alert" },
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
    { key: "under", label: t("rd.bmi_under", "Underweight"), sub: "<18.5", scaleX: 0.82, img: stageImg("bmi", "under") },
    { key: "healthy", label: t("rd.bmi_healthy", "Healthy"), sub: "18.5–25", scaleX: 0.98, img: stageImg("bmi", "healthy") },
    { key: "over", label: t("rd.bmi_over", "Overweight"), sub: "25–30", scaleX: 1.14, img: stageImg("bmi", "over") },
    { key: "obese", label: t("rd.bmi_obese", "Obese I"), sub: "30–35", scaleX: 1.30, img: stageImg("bmi", "obese") },
    { key: "obese2", label: t("rd.bmi_obese2", "Obese II+"), sub: "35+", scaleX: 1.44, img: stageImg("bmi", "obese2") },
  ];
  const bfStages = [
    { key: "essential", label: t("rd.bf_essential", "Essential"), sub: "2–8%", scaleX: 0.80, img: stageImg("bodyfat", "essential") },
    { key: "athletic", label: t("rd.bf_athletic", "Athletic"), sub: "8–14%", scaleX: 0.90, img: stageImg("bodyfat", "athletic") },
    { key: "fitness", label: t("rd.bf_fitness", "Fitness"), sub: "14–18%", scaleX: 1.00, img: stageImg("bodyfat", "fitness") },
    { key: "average", label: t("rd.bf_average", "Average"), sub: "18–25%", scaleX: 1.12, img: stageImg("bodyfat", "average") },
    { key: "high", label: t("rd.bf_high", "High"), sub: "25%+", scaleX: 1.26, img: stageImg("bodyfat", "high") },
  ];
  const whrStages = [
    { key: "low", label: t("rd.whr_low", "Low risk"), sub: "<0.90", scaleX: 0.92, img: stageImg("whr", "low") },
    { key: "moderate", label: t("rd.whr_moderate", "Moderate"), sub: "0.90–0.95", scaleX: 1.08, img: stageImg("whr", "moderate") },
    { key: "high", label: t("rd.whr_high", "High risk"), sub: "0.95+", scaleX: 1.24, img: stageImg("whr", "high") },
  ];

  const normalizedProducts = products.map(normalizeProduct);

  const RADAR_LABELS = [
    t("rd.radar_compos", "Compos."), t("rd.radar_weight", "Weight"), t("rd.radar_hydra", "Hydra."),
    t("rd.radar_caloric", "Caloric"), t("rd.radar_muscle", "Muscle"), t("rd.radar_cardio", "Cardio"),
  ];
  // 100% real: value (0–1) and score (0–100) come straight from each metric's score.
  const radarData = RADAR_LABELS.map((label, i) => {
    const v = d.radarData[i]?.now ?? 0;
    return { label, value: v, score: Math.round(v * 100) };
  });

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
  const coachWorking = locText(strengthsInsight?.points?.[0]) || summary || t("rd.summary_working", "Your strongest metrics are holding inside their healthy bands.");
  const coachDrifting = locText(concernsInsight?.points?.[0]) || t("rd.summary_drifting", "Keep an eye on the lowest-scoring metric in your report.");
  const coachWeek = locText(tips?.[0]) || locText(goalsInsight?.points?.[0]) || t("rd.summary_week", "Pick one habit from your plan and hold it all week.");

  const sexLabel = d.sex === "female" ? t("rd.female", "Female") : t("rd.male", "Male");

  // ── Per-card explainers (the quiet "i" next to each title) — how the
  //    value is computed, what it represents, why it matters. ──
  const INFO = {
    scan: t("rd.info_scan", "The AI describes what is visible in your photo — posture, where mass sits, muscle tone. It complements the numbers below, which are calculated from your measurements, not from the image. Read confidence reflects how well the photo (framing, light, clothing) supports the read."),
    bmi: t("rd.info_bmi", "BMI is your weight in kilograms divided by your height in meters squared, read against the WHO reference bands. It's a quick screening number — it can't tell muscle from fat, which is why we read it alongside body fat and waist-to-hip ratio."),
    bf: t("rd.info_bf", "Estimated with the Deurenberg formula from your BMI, age and sex — an estimate, not a direct measurement. Healthy bands shift with age and differ between men and women. The trend across assessments matters more than any single reading."),
    whr: t("rd.info_whr", "Your waist circumference divided by your hip circumference, from the measurements you entered. It shows where fat sits: fat stored around the waist carries more cardiometabolic risk than fat on the hips, and thresholds differ by sex."),
    weight: t("rd.info_weight", "Your goal is the weight you told us you felt best at (or a formula estimate if you didn't). The green band is the Lorentz healthy range for your height and sex, and the projection assumes a steady, sustainable pace over about 12 weeks."),
    comp: t("rd.info_comp", "Lean mass is everything that isn't fat — muscle, bone, organs and water — calculated as 100% minus your estimated body fat, then applied to your current weight for the kilogram figures. Keeping lean mass while losing fat is what the protein target protects."),
    tbw: t("rd.info_tbw", "Total body water is estimated with the Watson formula from your age, height, weight and sex. Water lives almost entirely in lean tissue, so this share falls as body fat rises. Staying near the ideal supports energy, digestion and recovery."),
    energy: t("rd.info_energy", "Your resting burn (BMR) comes from the Mifflin-St Jeor equation using weight, height, age and sex. We multiply it by your activity level, then adjust for your goal — a controlled deficit for weight loss, a surplus for gain. Your macros are built from this target."),
    macros: t("rd.info_macros", "Your daily calorie target split by goal: protein and carbs carry 4 kcal per gram, fat 9. Weight control favors more protein, maintenance and muscle gain favor more carbs. Protein is featured because it protects muscle while your weight changes."),
    rec: t("rd.info_rec", "Picks come from three sources: the AI photo analysis, the health concerns you selected on the form, and the metrics scoring lowest in this report — merged without duplicates. Every card states the specific signal it responds to."),
    risks: t("rd.info_risks", "Each key metric gets a 0–100 score based on how far it sits from its healthy band. Your best-scoring metric shows as a strength, a mid-range one as watch, and the lowest as action — the area where focused effort pays off most."),
    radar: t("rd.info_radar", "Each axis is one of your metric scores on a 0–100 scale — composition, weight, hydration, calories, muscle and cardio. The closer the shape reaches the outer edge, the closer that area sits to its healthy band; a balanced shape beats a spiky one."),
    summary: t("rd.info_summary", "Composed from your report: what's working is your strongest signal, what's drifting is your weakest, and this week is the first step from your plan. When AI photo analysis ran, its observations feed in here too."),
    metabolic: t("rd.info_metabolic", "An estimate of the age your overall wellness score corresponds to — scoring above the midpoint reads younger than your calendar age, below reads older. Treat it as a motivational compass, not a clinical measurement."),
  };

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
              {d.user.firstName} <span style={{ fontStyle: "italic", fontWeight: 400 }}>{d.user.lastName}</span>
            </h1>
            <p className="mx-auto mt-8 max-w-[44ch] text-lg leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {t("rd.hero_subtitle", "Your body assessment — a snapshot of where you stand today. Read it once, then let the plan do the work.")}
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href={`/results/visuals?sex=${d.sex === "female" ? "female" : "male"}`} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all hover:-translate-y-px" style={{ background: "white", color: "var(--ink)", border: "1px solid var(--border-hex, #E4D9C6)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                {t("atlas.open", "Open visual guide")}
              </Link>
              {answersHref && (
                <Link href={answersHref} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all hover:-translate-y-px" style={{ background: "white", color: "var(--ink)", border: "1px solid var(--border-hex, #E4D9C6)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h6v3H9zM9 4H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 11h6M9 15h4" /></svg>
                  {t("rd.view_answers", "See your answers")}
                </Link>
              )}
            </div>

            {/* Meta strip */}
            <div className={`grid ${meta.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} mt-16 py-7`} style={{ borderTop: "1px solid var(--border-hex)", borderBottom: "1px solid var(--border-hex)" }}>
              {meta.map((m, i, arr) => (
                <div key={m.l} className="flex flex-col items-center py-2" style={{ borderRight: i < arr.length - 1 ? "1px solid var(--border-hex)" : "none" }}>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>
                    {m.l}
                    {m.infoKey && <InfoHint text={INFO[m.infoKey]} />}
                  </div>
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
            {/* Your scan — uploaded photo + AI vision read (only when a real photo exists) */}
            {imageUrl && (
              <Card className="mb-4">
                <CardHeader title={t("rd.scan_title", "Your scan")} action={t("rd.scan_action", "AI photo analysis")} info={INFO.scan} />
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="shrink-0" style={{ width: 168 }}>
                    <div
                      className="group relative overflow-hidden cursor-zoom-in"
                      style={{ aspectRatio: "3 / 4", borderRadius: 14, border: "1.5px solid #C7A977" }}
                      onClick={openScan}
                      role="button"
                      tabIndex={0}
                      aria-label={t("rd.enlarge_hint", "Enlarge")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openScan(); } }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={t("rd.scan_photo_alt", "Your body scan photo")} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center top", filter: "grayscale(0.12) contrast(1.02)" }} />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "#9B8573", mixBlendMode: "multiply", opacity: 0.12 }} />
                      <span className="absolute top-2 right-2 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 24, height: 24, background: "rgba(47,47,43,0.55)" }}>
                        <ExpandIcon size={13} color="white" />
                      </span>
                    </div>
                    {/* How much the photo supports the read (angle, light, framing) */}
                    {vd.read_confidence != null && (
                      <div className="mt-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.confidence_label", "Read confidence")}</span>
                          <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{vd.read_confidence}%</span>
                        </div>
                        <div className="mt-1.5 h-1 rounded-full" style={{ background: "rgba(47,47,43,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${vd.read_confidence}%`, background: "#C7A977" }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Trait chips — enum ids resolved in the current UI language */}
                    {scanTraits.length > 0 && (
                      <div className="flex flex-wrap gap-x-7 gap-y-4 mb-5">
                        {scanTraits.map((tr, i) => (
                          <div key={tr.label}>
                            <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{tr.label}</div>
                            <span className="inline-block mt-1.5 text-[13px] font-semibold px-3 py-1 rounded-full" style={i === 0 ? { background: "#F5EBD5", color: "#8E6418" } : { background: "rgba(47,47,43,0.05)", color: "var(--ink)" }}>{tr.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Visual body-fat read vs the formula estimate */}
                    {vbf && (
                      <div className="mb-5 rounded-[12px] px-4 py-3.5" style={{ background: "#FAF6EE", border: "1px dashed var(--border-hex)" }}>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.vbf_label", "Visual body-fat read")}</span>
                          <span className="text-[20px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{vbf.low}–{vbf.high}<span className="text-[12px] font-normal" style={{ color: "var(--muted-fg)" }}>%</span></span>
                          {vbfVerdictText && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={vbfVerdict === "match" ? { background: "#EAEFE6", color: "#1F6B50" } : { background: "#F5EBD5", color: "#8E6418" }}>
                              {vbfVerdictText}
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] leading-relaxed mt-2" style={{ color: "var(--muted-fg)" }}>
                          {t("rd.vbf_caption", "Estimated from visible definition in the photo. The formula estimate below remains the reference number.")}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      {/* Posture — structured flags first, then the free-text note */}
                      {(postureFlags.length > 0 || postureNote) && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.posture_label", "Posture")}</div>
                          {postureFlags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {postureFlags.map((f) => (
                                <span key={f.id} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={f.id === "neutral" ? { background: "#EAEFE6", color: "#1F6B50" } : { background: "rgba(47,47,43,0.05)", color: "var(--ink)" }}>{f.label}</span>
                              ))}
                            </div>
                          )}
                          {postureNote && <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: "var(--ink)" }}>{postureNote}</p>}
                        </div>
                      )}
                      {[
                        { label: t("rd.composition_label", "Mass distribution"), text: compositionNote },
                        { label: t("rd.photo_note_label", "Photo note"), text: photoQualityNote },
                      ].filter(n => n.text).map(n => (
                        <div key={n.label}>
                          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{n.label}</div>
                          <p className="text-[13.5px] leading-relaxed mt-1" style={{ color: "var(--ink)" }}>{n.text}</p>
                        </div>
                      ))}
                      {/* Never leave the panel empty: when the AI read returned no notes,
                          show the summary or a localized explanation instead. */}
                      {!postureNote && !compositionNote && !photoQualityNote && scanTraits.length === 0 && !vbf && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.scan_title", "Your scan")}</div>
                          <p className="text-[13.5px] leading-relaxed mt-1" style={{ color: "var(--ink)" }}>
                            {(visionAvailable && summary) || t("rd.scan_no_read", "The AI couldn't extract detailed notes from this photo. Your metrics below are calculated from your measurements and are not affected.")}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Where the photo says to focus first */}
                    {focusAreas.length > 0 && (
                      <div className="mt-5 pt-4" style={{ borderTop: "1px dashed var(--border-hex)" }}>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.focus_label", "Where to focus first")}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {focusAreas.map((f) => (
                            <span key={f} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "#F5EBD5", color: "#8E6418" }}>{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            {/* Row 1: BMI + Body Fat */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader title={t("rd.bmi_title", "Body Mass Index")} action={t("rd.bmi_action", "WHO reference")} info={INFO.bmi} />
                <LinearRange value={d.bmi} min={15} max={40} segments={bmiSegments} unit={t("rd.unit_bmi", "kg / m²")} caption={bmiCaption} />
                <StageStrip stages={bmiStages} activeKey={PICK.bmi(d.bmi)} sexToggle={sexToggleFor("bmi")} caption={t("rd.bmi_spectrum_caption", "BMI maps weight to height only — it can't see muscle. The silhouettes show the broad external shape each band tends to produce.")} />
              </Card>
              <Card>
                <CardHeader title={t("rd.bf_title", "Body Fat")} action={t("rd.bf_action_dynamic", "{{sex}} · {{age}} years", { sex: sexLabel, age: d.user.age })} info={INFO.bf} />
                <LinearRange value={d.bodyFat} min={5} max={32} segments={bfSegments} unit={t("rd.unit_percent", "percent")} caption={bfCaption} />
                <StageStrip stages={bfStages} activeKey={PICK.bodyFat(d.bodyFat)} sexToggle={sexToggleFor("bodyfat", {
                  male: t("rd.bf_spectrum_caption", "You read in the Fitness band — visible tone without extremes. The figures show the typical external look across the male body-fat range."),
                  female: t("rd.bf_spectrum_caption_female", "The figures show the typical external look across the female body-fat range — same height and weight, different composition."),
                })} caption={stageSex === "female"
                  ? t("rd.bf_spectrum_caption_female", "The figures show the typical external look across the female body-fat range — same height and weight, different composition.")
                  : t("rd.bf_spectrum_caption", "You read in the Fitness band — visible tone without extremes. The figures show the typical external look across the male body-fat range.")} />
              </Card>
            </div>

            {/* Row 2: WHR + Weight */}
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-4 mb-4">
              <Card>
                <CardHeader title={t("rd.whr_title", "Waist-to-Hip Ratio")} action={t("rd.whr_action", "Cardiometabolic risk")} info={INFO.whr} />
                <LinearRange value={d.whr} min={0.75} max={1.05} segments={whrSegments} unit={t("rd.unit_ratio", "ratio")} decimals={2} caption={whrCaption} />
                <StageStrip stages={whrStages} activeKey={PICK.whr(d.whr)} sexToggle={sexToggleFor("whr")} caption={t("rd.whr_spectrum_caption", "Waist-to-hip ratio reflects where fat sits. Lower ratios carry less cardiometabolic risk; the shapes show low, moderate and high distribution.")} />
              </Card>
              <Card>
                <CardHeader title={t("rd.weight_title", "Weight Analysis")} action={t("rd.weight_action", "Lorentz healthy band")} info={INFO.weight} />
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.delta_to_goal", "DELTA TO GOAL")}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[72px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>{goalSign}{d.weightDelta}</span>
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
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{d.weightGoal > d.weight ? t("rd.to_gain", "To gain") : t("rd.to_lose", "To lose")}</div>
                      <div className="text-[22px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{d.weightDelta}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_kg", "kg")}</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.weekly_rate", "Weekly rate")}</div>
                      <div className="text-[22px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>~{(d.weightDelta / 12).toFixed(1)}<span className="text-xs ml-1 font-normal" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_kg_wk", "kg/wk")}</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.bmi_at_goal", "BMI at goal")}</div>
                      <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                        <span className="text-[22px] font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}>{bmiGoal}</span>
                        {bmiGoalTag && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: bmiGoalTag.bg, color: bmiGoalTag.color }}>{bmiGoalTag.label}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Row 3: Composition + TBW */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="flex flex-col">
                <CardHeader title={t("rd.comp_title", "Body Composition")} action={t("rd.comp_action", "Lean vs fat")} info={INFO.comp} />
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 sm:gap-7 py-1">
                  <div className="shrink-0" style={{ width: 132, height: 132 }}>
                    <CompositionRing leanPct={d.lbmPct} />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="grid items-center gap-x-3 gap-y-3.5" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
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
                <CardHeader title={t("rd.tbw_title", "Total Body Water")} action={t("rd.tbw_action", "Hydration share")} info={INFO.tbw} />
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 sm:gap-7 py-1">
                  <HydrationColumn pct={d.tbwPct} ideal={60} />
                  <div className="flex-1 min-w-0 w-full">
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
                <p className="text-[13px] leading-relaxed mt-6" style={{ color: "var(--muted-fg)" }}>{tbwCaption}</p>
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
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.7)" }}>{t("rd.daily_energy", "Daily energy")}<InfoHint text={INFO.energy} dark /></span>
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
                  <CardHeader title={t("rd.macro_title", "Macro Split")} action={t("rd.macro_action", "Per day")} info={INFO.macros} />
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{t("rd.featured_protein", "FEATURED · DAILY PROTEIN")}</div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-[72px] leading-none font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>{d.macros.protein.g}</span>
                    <span className="text-xl" style={{ color: "var(--muted-fg)" }}>{t("rd.unit_g", "g")}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed mt-3 max-w-[34ch]" style={{ color: "var(--muted-fg)" }}>
                    {t("rd.macro_desc", "Set by your goal — protein, carbs and fat as a share of your daily calories.")}
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
                    <CardHeader title={t("rd.rec_title", "Recommended")} action={t("rd.rec_action_dynamic", "{{n}} picks · tied to signals", { n: normalizedProducts.length })} info={INFO.rec} />
                    <h3 className="text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.028em] mt-2" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
                      {t("rd.rec_headline_1", "Chosen for you.")}<br />
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
                      {/* Prominent product image panel (full-bleed to the card edges) */}
                      <div
                        className={`group relative -mx-[30px] -mt-[26px] mb-5 overflow-hidden flex items-center justify-center ${p.image ? "cursor-zoom-in" : ""}`}
                        style={{ height: 200, background: p.image ? "#F4EFE7" : `linear-gradient(135deg, ${p.grad})`, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
                        onClick={p.image ? () => openProduct(p) : undefined}
                        role={p.image ? "button" : undefined}
                        tabIndex={p.image ? 0 : undefined}
                        aria-label={p.image ? `${p.name} — ${t("rd.enlarge_hint", "Enlarge")}` : undefined}
                        onKeyDown={p.image ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProduct(p); } } : undefined}
                      >
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-contain" />
                        ) : (
                          <Icon name={p.icon} size={44} color="white" />
                        )}
                        <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-[0.14em] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.88)", color: "var(--primary-hex, #9B8573)" }}>
                          {t("rd.for_prefix", "FOR")} · {(p.condition || "").toUpperCase()}
                        </span>
                        {p.image && (
                          <span className="absolute top-3 right-3 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 24, height: 24, background: "rgba(47,47,43,0.5)" }}>
                            <ExpandIcon size={13} color="white" />
                          </span>
                        )}
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
              <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ink)" }}>
                {t("rd.risks_title", "Signals")}
                <InfoHint text={INFO.risks} />
              </div>
            )}
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
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ink)" }}>{t("rd.profile_title", "Profile")}<InfoHint text={INFO.radar} /></span>
                  <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted-fg)" }}>
                    <span className="w-3 h-0.5" style={{ background: "var(--primary-hex)" }} />{t("rd.your_profile", "Your profile")}
                  </span>
                </div>
                <div className="flex-1 flex justify-center items-center">
                  <Radar data={radarData} />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-5" style={{ borderTop: "1px dashed var(--border-hex)" }}>
                  {radarData.map(r => (
                    <div key={r.label}>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--muted-fg)" }}>{r.label}</div>
                      <div className="text-[20px] font-semibold mt-1" style={{ fontFamily: "var(--font-inter)", color: "var(--primary-hex, #9B8573)" }}>
                        {r.score}<span className="text-[11px] font-normal" style={{ color: "var(--muted-fg)" }}>/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Coach note */}
              <Card>
                <CardHeader title={t("rd.summary_title", "Summary")} info={INFO.summary} />
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
