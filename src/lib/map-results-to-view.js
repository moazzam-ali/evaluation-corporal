// Transforms the API analysis response into the flat view-model
// consumed by BodyResultsTemplate (the demo results layout).

import { calculateAge, ACTIVITY_MULTIPLIERS, GOAL_MULTIPLIERS } from "@/lib/body-analysis";

function findMetric(metrics, id) {
  return metrics.find((m) => m.id === id) || { value: null, score: 50, meta: {} };
}

function round(v, d = 1) {
  if (v == null || isNaN(v)) return 0;
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * @param {{ formData: object, results: object }} input
 * @returns {object} view-model matching the DEMO shape in the results template
 */
export function mapResultsToView({ formData, results }) {
  const metrics = results.metrics || [];
  const summary = results.computed_summary || {};

  const weight = Number(formData.weight) || 0;
  const height = Number(formData.height) || 0;
  const age = calculateAge(formData.birthDate);
  const overallScore = results.overall_score || 0;

  // Core metrics
  const bmi = findMetric(metrics, "bmi").value;
  const bodyFat = findMetric(metrics, "body_fat").value;
  const whr = findMetric(metrics, "waist_hip_ratio").value;

  // Lean mass
  const lbmPct = findMetric(metrics, "lean_mass").value;
  const lbmKg = lbmPct != null ? round(weight * lbmPct / 100, 1) : 0;

  // Body water
  const tbwL = findMetric(metrics, "total_body_water").value;
  const tbwPct = tbwL != null && weight > 0 ? round((tbwL / weight) * 100, 0) : 0;

  // Energy
  const bmr = findMetric(metrics, "bmr").value || 0;
  const calories = findMetric(metrics, "calorie_target").value || 0;
  const activity = calories - bmr;

  // Deficit: for weight_control, TDEE = bmr × activity_mult, deficit = TDEE - calories
  const actMult = ACTIVITY_MULTIPLIERS[formData.exercise_level] || 1.375;
  const tdee = Math.round(bmr * actMult);
  const goalKey = formData.goal || "maintain_care";
  const deficit = goalKey === "weight_control" ? Math.max(0, tdee - calories) : 0;

  // Weight analysis — the goal is the weight the USER said they'd feel good at
  // (form: weight_at_ideal_age). Only when they didn't provide one do we fall
  // back to the Lorentz-derived estimate. Delta = current − goal.
  const healthyWeightMetric = findMetric(metrics, "healthy_weight");
  const healthyWeight = healthyWeightMetric.value || weight;
  const userGoalWeight = Number(formData.weight_at_ideal_age) || null;
  let weightGoal;
  if (userGoalWeight && userGoalWeight > 20 && userGoalWeight < 400) {
    weightGoal = round(userGoalWeight, 1);
  } else {
    const lorentzDelta = healthyWeightMetric.meta?.delta != null
      ? Math.abs(healthyWeightMetric.meta.delta)
      : round(Math.abs(weight - healthyWeight), 1);
    weightGoal = goalKey === "gain_weight"
      ? round(weight + lorentzDelta, 1)
      : round(weight - lorentzDelta, 1);
  }
  const weightDelta = round(Math.abs(weight - weightGoal), 1);
  const healthyRange = [
    round(Math.max(healthyWeight - 5, 40), 0),
    round(healthyWeight + 5, 0),
  ];

  // Realistic timeline to the goal at a sustainable pace (~0.75 kg/week for
  // loss, ~0.35 kg/week for gain), capped between 4 weeks and 2 years — the
  // old fixed "12 weeks" implied absurd weekly rates for large deltas.
  const losing = weightGoal <= weight;
  const pace = losing ? 0.75 : 0.35;
  const weeksToGoal = clamp(Math.round(weightDelta / pace) || 4, 4, 104);

  // Macros
  const proteinMetric = findMetric(metrics, "protein_target");
  const carbsMetric = findMetric(metrics, "carbs_target");
  const fatMetric = findMetric(metrics, "fat_target");
  const macros = {
    protein: { g: proteinMetric.value || 0, pct: proteinMetric.meta?.pct || 0 },
    carbs: { g: carbsMetric.value || 0, pct: carbsMetric.meta?.pct || 0 },
    fats: { g: fatMetric.value || 0, pct: fatMetric.meta?.pct || 0 },
  };

  // Radar data — 6 dimensions straight from each metric's real score (0-1 scale).
  const radarIds = ["body_fat", "healthy_weight", "hydration_target", "calorie_target", "lean_mass", "waist_hip_ratio"];
  const radarData = radarIds.map((id) => ({ now: round(findMetric(metrics, id).score / 100, 2) }));

  // Metabolic age — estimate from overall score. Null if age unknown.
  let metabolicAge = null;
  if (age != null) {
    const offset = Math.round((overallScore - 50) / 10);
    metabolicAge = clamp(age - offset, age - 10, age + 5);
  }

  return {
    user: {
      firstName: formData.name || "",
      lastName: formData.surname || "",
      age,
      height,
      weight,
      metabolicAge,
    },
    bmi: bmi ?? 0,
    bodyFat: bodyFat ?? 0,
    whr: whr ?? 0,
    weight,
    weightGoal,
    weightDelta,
    healthyRange,
    lbmPct: lbmPct ?? 0,
    lbmKg,
    tbwPct,
    tbwL: tbwL ?? 0,
    calories,
    bmr,
    activity: Math.max(0, activity),
    deficit,
    macros,
    radarData,
    sex: formData.sex || "male",
    goal: goalKey,
    weeksToGoal,
    // Body-water reference differs by sex (Watson healthy bands ≈ 55–65%
    // male, 47–57% female) — 60% is only the male midpoint.
    tbwIdeal: (formData.sex || "male") === "female" ? 52 : 60,
  };
}
