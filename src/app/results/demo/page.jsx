"use client";

import { useTranslation } from "react-i18next";
import BodyResultsTemplate from "@/components/results/BodyResultsTemplate";

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
  sex: "male",
  macros: {
    protein: { g: 161, pct: 30 },
    carbs: { g: 215, pct: 40 },
    fats: { g: 72, pct: 30 },
  },
  radarData: [
    { now: 0.78, prev: 0.72 },
    { now: 0.82, prev: 0.75 },
    { now: 0.56, prev: 0.62 },
    { now: 0.74, prev: 0.70 },
    { now: 0.81, prev: 0.78 },
    { now: 0.68, prev: 0.65 },
  ],
  // Used by template when no raw metrics are passed
  _demoRisks: [],
};

/* Structured photo read shown on the demo scan card — machine ids only;
   the template resolves them in the current UI language. */
const DEMO_VISION_DETAILS = {
  visual_body_fat: { low: 16, high: 20 },
  fat_distribution: "android",
  muscle_tone: "moderate",
  symmetry: "balanced",
  posture_flags: ["rounded_shoulders", "forward_head"],
  focus_areas: ["core", "posture"],
  read_confidence: 84,
};

export default function DemoResultsPage() {
  const { t } = useTranslation();

  const DEMO_PRODUCTS = [
    { name: "Rebuild Strength", icon: "dumbbell", grad: "#2F2F2B, #9B8573", condition: t("rd.prod1_condition", "Athlete recovery"), why: t("rd.prod1_why", "Post-workout recovery formula with BCAAs. Matched to your exercise frequency of 4–5 days/week."), dose: t("rd.prod1_dose", "1 scoop"), timing: t("rd.prod1_timing", "Post workout") },
    { name: "Phyto Complete", icon: "leaf", grad: "#8D9A84, #2F2F2B", condition: t("rd.prod2_condition", "Belly fat"), why: t("rd.prod2_why", "Plant-based meal replacement designed to support weight management and reduce abdominal fat."), dose: t("rd.prod2_dose", "1 serving"), timing: t("rd.prod2_timing", "Lunch swap") },
    { name: "HerbalifeLine Max", icon: "droplet", grad: "#6B5B4B, #C7A977", condition: t("rd.prod3_condition", "Cholesterol"), why: t("rd.prod3_why", "Omega-3 EPA+DHA supplement supporting cardiovascular health and healthy cholesterol levels."), dose: t("rd.prod3_dose", "1 softgel"), timing: t("rd.prod3_timing", "With breakfast") },
  ];

  const DEMO_RISKS = [
    { tone: "good", label: t("rd.risk_strength", "STRENGTH"), note: t("rd.risk_strength_note", "Lean mass up 0.8 kg. Deficit is sparing muscle.") },
    { tone: "normal", label: t("rd.risk_watch", "WATCH"), note: t("rd.risk_watch_note", "Hydration at 56% — below the 60% ideal.") },
    { tone: "alert", label: t("rd.risk_action", "ACTION"), note: t("rd.risk_action_note", "WHR at upper edge. Anterior fat pattern.") },
  ];

  return (
    <BodyResultsTemplate
      data={{ ...DEMO, _demoRisks: DEMO_RISKS }}
      products={DEMO_PRODUCTS}
      insights={[]}
      tips={[]}
      summary=""
      metrics={[]}
      imageUrl="/hero-body.webp"
      bodyType="mesomorph"
      postureNote={t("rd.demo_posture_note", "Shoulders roll slightly forward of the hip line; the spine stacks well otherwise.")}
      compositionNote={t("rd.demo_composition_note", "Mass is carried mainly around the midsection, with proportionate limbs.")}
      photoQualityNote={t("rd.demo_photo_note", "Good lighting and framing — full body visible, clothing slightly loose around the waist.")}
      visionDetails={DEMO_VISION_DETAILS}
      visionAvailable
    />
  );
}
