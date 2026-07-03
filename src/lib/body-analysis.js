// Body composition + nutrition calculations.
// All inputs come from the 7-step intake form; outputs are deterministic
// and used by the results page (alongside optional AI vision insights).

const SUPPORTED_LANGS = ["en", "es", "fr", "de", "it", "tr", "in", "pt"];

const ACTIVITY_MULTIPLIERS = {
  little: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_MULTIPLIERS = {
  weight_control: 0.8,
  maintain_care: 1.0,
  gain_weight: 1.2,
};

// Goal-based macro split as a share of daily calories (matches the reference
// sheet: Weight control 30/40/30, Maintenance 25/45/30, Muscle gain 20/55/25).
const MACRO_SPLITS = {
  weight_control: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  maintain_care: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  gain_weight: { protein: 0.20, carbs: 0.55, fat: 0.25 },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round(n, decimals = 1) {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function parseBirthDate(s) {
  if (!s) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function calculateAge(birthDate) {
  const d = typeof birthDate === "string" ? parseBirthDate(birthDate) : birthDate;
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return round(weightKg / (h * h), 1);
}

export function classifyBMI(bmi) {
  if (bmi == null) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obesity_i";
  if (bmi < 40) return "obesity_ii";
  return "obesity_iii";
}

// Deurenberg body fat %.
export function calculateBodyFat({ bmi, age, sex }) {
  if (bmi == null || age == null || !sex) return null;
  const sexFactor = sex === "male" ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4;
  return round(clamp(bf, 3, 65), 1);
}

export function classifyBodyFat({ bodyFat, age, sex }) {
  if (bodyFat == null || age == null || !sex) return "unknown";
  const bands = sex === "male"
    ? { young: [8, 19, 24], mid: [11, 22, 27], older: [13, 25, 30] }   // [low, healthy_max, overweight_max]
    : { young: [21, 33, 39], mid: [23, 34, 40], older: [24, 36, 42] };
  const band = age < 40 ? bands.young : age < 60 ? bands.mid : bands.older;
  if (bodyFat < band[0]) return "low";
  if (bodyFat <= band[1]) return "healthy";
  if (bodyFat <= band[2]) return "overweight";
  return "obesity";
}

export function calculateLeanMass(bodyFat) {
  if (bodyFat == null) return null;
  return round(100 - bodyFat, 1);
}

export function calculateWHR(waistCm, hipCm) {
  if (!waistCm || !hipCm) return null;
  return round(waistCm / hipCm, 2);
}

export function classifyWHR({ whr, sex }) {
  if (whr == null || !sex) return "unknown";
  if (sex === "male") {
    if (whr < 0.90) return "low";
    if (whr <= 1.0) return "moderate";
    return "high";
  }
  if (whr < 0.80) return "low";
  if (whr <= 0.85) return "moderate";
  return "high";
}

// Lorentz healthy-weight formula (kg) from height in cm.
export function calculateHealthyWeight({ heightCm, sex }) {
  if (!heightCm || !sex) return null;
  const base = heightCm - 100;
  const adjustment = sex === "male" ? (heightCm - 150) / 4 : (heightCm - 150) / 2.5;
  return round(base - adjustment, 1);
}

// Watson total-body-water in liters.
export function calculateTBW({ age, heightCm, weightKg, sex }) {
  if (!age || !heightCm || !weightKg || !sex) return null;
  const tbw = sex === "male"
    ? 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg
    : -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
  return round(Math.max(0, tbw), 1);
}

// Mifflin-St Jeor BMR in kcal/day.
export function calculateBMR({ weightKg, heightCm, age, sex }) {
  if (!weightKg || !heightCm || !age || !sex) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === "male" ? 5 : -161));
}

export function calculateCalories({ bmr, activityLevel, goal }) {
  if (!bmr) return null;
  const am = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  const gm = GOAL_MULTIPLIERS[goal] || 1.0;
  return Math.round(bmr * am * gm);
}

export function calculateMacros({ calories, goal }) {
  if (!calories) return null;
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS.maintain_care;
  // Grams and percentages read directly from the goal's split (share of calories):
  // protein/carbs at 4 kcal/g, fat at 9 kcal/g. Percentages mirror the sheet exactly.
  return {
    proteinG: Math.round((calories * split.protein) / 4),
    carbsG: Math.round((calories * split.carbs) / 4),
    fatG: Math.round((calories * split.fat) / 9),
    proteinPct: Math.round(split.protein * 100),
    carbsPct: Math.round(split.carbs * 100),
    fatPct: Math.round(split.fat * 100),
  };
}

// Hydration target in liters (0.033 L per kg, rounded to 0.1 L).
export function calculateHydrationTarget(weightKg) {
  if (!weightKg) return null;
  return round(weightKg * 0.033, 1);
}

// Convert form `water_intake` enum into liters (best-effort).
function parseWaterIntake(value) {
  if (!value) return null;
  const map = {
    less_1l: 0.75,
    "1_2l": 1.5,
    "2_3l": 2.5,
    more_3l: 3.5,
  };
  return map[value] ?? null;
}

// Score 0-100 for how close a value is to a healthy band.
function scoreInBand(value, healthyLow, healthyHigh, span = healthyHigh - healthyLow) {
  if (value == null) return 50;
  if (value >= healthyLow && value <= healthyHigh) return 100;
  const distance = value < healthyLow ? healthyLow - value : value - healthyHigh;
  return clamp(Math.round(100 - (distance / span) * 100), 0, 100);
}

function statusFromScore(score) {
  if (score == null) return "normal";
  if (score >= 80) return "good";
  if (score >= 40) return "normal";
  return "needs_attention";
}

/**
 * Compute every body metric from intake form data.
 * Pure function — no I/O.
 */
export function computeBodyMetrics(formData = {}) {
  const sex = formData.sex || null;
  const weightKg = Number(formData.weight) || null;
  const heightCm = Number(formData.height) || null;
  const waistCm = Number(formData.waist) || null;
  const hipCm = Number(formData.hip) || null;
  const idealWeightKg = Number(formData.weight_at_ideal_age) || null;
  const age = calculateAge(formData.birthDate);

  const bmi = calculateBMI(weightKg, heightCm);
  const bmiCategory = classifyBMI(bmi);
  const bodyFat = calculateBodyFat({ bmi, age, sex });
  const bodyFatCategory = classifyBodyFat({ bodyFat, age, sex });
  const leanMassPct = calculateLeanMass(bodyFat);
  const whr = calculateWHR(waistCm, hipCm);
  const whrCategory = classifyWHR({ whr, sex });
  const healthyWeight = calculateHealthyWeight({ heightCm, sex });
  const tbw = calculateTBW({ age, heightCm, weightKg, sex });
  const bmr = calculateBMR({ weightKg, heightCm, age, sex });
  const calories = calculateCalories({ bmr, activityLevel: formData.exercise_level, goal: formData.goal });
  const macros = calculateMacros({ calories, goal: formData.goal });
  const hydrationTarget = calculateHydrationTarget(weightKg);
  const currentIntake = parseWaterIntake(formData.water_intake);

  // Scores (0-100) for the ring cards
  const bmiScore = bmi == null ? 50 : scoreInBand(bmi, 18.5, 24.9, 5);
  const bodyFatScore = bodyFat == null ? 50 : (
    bodyFatCategory === "healthy" ? 95 :
    bodyFatCategory === "low" ? 60 :
    bodyFatCategory === "overweight" ? 50 :
    bodyFatCategory === "obesity" ? 25 : 70
  );
  const whrScore = whr == null ? 50 : (
    whrCategory === "low" ? 95 :
    whrCategory === "moderate" ? 65 : 30
  );
  const hydrationScore = currentIntake == null || hydrationTarget == null ? 50 :
    clamp(Math.round((currentIntake / hydrationTarget) * 100), 0, 100);
  const leanMassScore = leanMassPct == null ? 50 :
    clamp(Math.round(leanMassPct), 0, 100);
  const tbwScore = tbw == null || weightKg == null ? 50 :
    scoreInBand((tbw / weightKg) * 100, sex === "male" ? 55 : 47, sex === "male" ? 65 : 57, 6);
  const calorieScore = calories == null || idealWeightKg == null || weightKg == null ? 70 :
    scoreInBand(weightKg, idealWeightKg - 3, idealWeightKg + 3, 8);

  const metrics = [
    {
      id: "bmi",
      score: bmiScore,
      status: statusFromScore(bmiScore),
      value: bmi,
      unit: "kg/m²",
      category: bmiCategory,
      insight: bmi == null ? null : `BMI of ${bmi} — ${bmiCategory.replace("_", " ")} range.`,
    },
    {
      id: "body_fat",
      score: bodyFatScore,
      status: statusFromScore(bodyFatScore),
      value: bodyFat,
      unit: "%",
      category: bodyFatCategory,
      insight: bodyFat == null ? null : `Estimated body fat ${bodyFat}% — ${bodyFatCategory} for your age band.`,
    },
    {
      id: "lean_mass",
      score: leanMassScore,
      status: statusFromScore(leanMassScore),
      value: leanMassPct,
      unit: "%",
    },
    {
      id: "waist_hip_ratio",
      score: whrScore,
      status: statusFromScore(whrScore),
      value: whr,
      unit: "",
      category: whrCategory,
      insight: whr == null ? null : `Waist-to-hip ratio ${whr} — ${whrCategory} cardiometabolic risk band.`,
    },
    {
      id: "healthy_weight",
      score: 100,
      status: "good",
      value: healthyWeight,
      unit: "kg",
      meta: { current: weightKg, delta: healthyWeight && weightKg ? round(weightKg - healthyWeight, 1) : null },
    },
    {
      id: "total_body_water",
      score: tbwScore,
      status: statusFromScore(tbwScore),
      value: tbw,
      unit: "L",
    },
    {
      id: "bmr",
      score: 100,
      status: "good",
      value: bmr,
      unit: "kcal",
    },
    {
      id: "calorie_target",
      score: calorieScore,
      status: statusFromScore(calorieScore),
      value: calories,
      unit: "kcal",
    },
    {
      id: "protein_target",
      score: 100,
      status: "good",
      value: macros?.proteinG,
      unit: "g",
      meta: { pct: macros?.proteinPct },
    },
    {
      id: "carbs_target",
      score: 100,
      status: "good",
      value: macros?.carbsG,
      unit: "g",
      meta: { pct: macros?.carbsPct },
    },
    {
      id: "fat_target",
      score: 100,
      status: "good",
      value: macros?.fatG,
      unit: "g",
      meta: { pct: macros?.fatPct },
    },
    {
      id: "hydration_target",
      score: hydrationScore,
      status: statusFromScore(hydrationScore),
      value: hydrationTarget,
      unit: "L",
      meta: { current: currentIntake },
    },
  ];

  // Composite wellness score = average of the meaningful 0-100 scores.
  const scoredMetrics = [bmiScore, bodyFatScore, whrScore, hydrationScore, leanMassScore, tbwScore];
  const overallScore = Math.round(
    scoredMetrics.reduce((a, b) => a + b, 0) / scoredMetrics.length
  );

  return {
    age,
    sex,
    metrics,
    overallScore,
    summary: {
      bmi,
      bmiCategory,
      bodyFat,
      bodyFatCategory,
      whr,
      whrCategory,
      bmr,
      calories,
      macros,
      hydrationTarget,
      healthyWeight,
      weightKg,
      heightCm,
    },
  };
}

// Insight point for a metric as a translatable { key, params, text } object.
// `text` is the English fallback so legacy consumers (and old stored rows)
// still render; the client resolves `rd.<key>` with params in the UI language.
function metricInsightPoint(m) {
  const cat = m.category || "unknown";
  switch (m.id) {
    case "bmi":
      return { key: "ins_bmi", params: { value: m.value, cat }, text: `BMI of ${m.value} — ${cat.replace("_", " ")} range.` };
    case "body_fat":
      return { key: "ins_bf", params: { value: m.value, cat }, text: `Estimated body fat ${m.value}% — ${cat} for your age band.` };
    case "waist_hip_ratio":
      return { key: "ins_whr", params: { value: m.value, cat }, text: `Waist-to-hip ratio ${m.value} — ${cat} cardiometabolic risk band.` };
    case "hydration_target":
      return { key: "ins_hydration", params: { value: m.value }, text: `Daily hydration target ${m.value} L.` };
    default:
      return m.insight ? { key: null, params: {}, text: m.insight } : null;
  }
}

export function deriveInsights(metrics, summary) {
  const strengths = [];
  const concerns = [];
  const lifestyle = [];
  const goals = [];

  for (const m of metrics) {
    if (m.status === "good" && ["bmi", "body_fat", "waist_hip_ratio", "hydration_target"].includes(m.id)) {
      const p = metricInsightPoint(m);
      if (p) strengths.push(p);
    }
    if (m.status === "needs_attention") {
      const p = metricInsightPoint(m);
      if (p) concerns.push(p);
    }
  }

  if (summary.calories) {
    lifestyle.push({ key: "ins_cal", params: { kcal: summary.calories }, text: `Daily calorie target ${summary.calories} kcal based on your activity and goal.` });
  }
  if (summary.macros) {
    const { proteinG: p, carbsG: c, fatG: f } = summary.macros;
    lifestyle.push({ key: "ins_macros", params: { p, c, f }, text: `Macro split: ${p}g protein · ${c}g carbs · ${f}g fat.` });
  }
  if (summary.weightKg && summary.healthyWeight) {
    const delta = round(summary.weightKg - summary.healthyWeight, 1);
    if (delta > 0) goals.push({ key: "ins_goal_above", params: { delta }, text: `To reach your healthy weight band, you're ${delta} kg above the Lorentz target.` });
    else if (delta < 0) goals.push({ key: "ins_goal_below", params: { delta: Math.abs(delta) }, text: `You're ${Math.abs(delta)} kg below the Lorentz target — focus on lean mass.` });
    else goals.push({ key: "ins_goal_at", params: {}, text: "You're already at your Lorentz target weight." });
  }

  return [
    { category: "strengths", title: "Your strengths", points: strengths.length ? strengths : [{ key: "ins_strength_default", params: {}, text: "Most metrics within healthy bands." }] },
    { category: "concerns", title: "Focus areas", points: concerns.length ? concerns : [{ key: "ins_concern_default", params: {}, text: "No critical concerns flagged by the formulas." }] },
    { category: "lifestyle", title: "Lifestyle plan", points: lifestyle },
    { category: "goals", title: "Your goals", points: goals.length ? goals : [{ key: "ins_goal_default", params: {}, text: "Maintain current habits and re-scan in 4 weeks." }] },
  ];
}

export { SUPPORTED_LANGS, ACTIVITY_MULTIPLIERS, GOAL_MULTIPLIERS, MACRO_SPLITS };
