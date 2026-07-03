// Body-composition vision prompt — receives a full-body photo and the
// already-computed formula metrics, returns qualitative AI insights.

const LANG_NAMES = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  it: "Italian", tr: "Turkish", pt: "Portuguese", in: "Hindi",
};

// Fixed vocabularies for the structured photo read. These are machine ids —
// they stay English in the stored analysis and are translated by the client
// (rd.* keys), so the scan card follows the UI language like everything else.
const VISION_ENUMS = {
  body_type: ["athletic", "balanced", "endomorph", "ectomorph", "mesomorph", "mixed"],
  fat_distribution: ["android", "gynoid", "mixed", "even"],
  muscle_tone: ["low", "moderate", "defined", "athletic"],
  symmetry: ["balanced", "slight_asymmetry", "notable_asymmetry"],
  posture_flags: [
    "neutral", "forward_head", "rounded_shoulders", "uneven_shoulders",
    "anterior_pelvic_tilt", "posterior_pelvic_tilt", "lateral_lean",
  ],
  focus_areas: ["core", "upper_body", "lower_body", "posture", "symmetry", "overall_conditioning"],
};

/**
 * Build the vision prompt for body assessment.
 * The model is given the photo *and* the computed metrics so its insights
 * can reference real numbers instead of inventing them.
 */
export function getBodyVisionPrompt({ language = "en", formData = {}, computed = {}, productIds = [] } = {}) {
  const langName = LANG_NAMES[language] || "English";
  const summary = computed.summary || {};

  const productCatalog = productIds.length
    ? `\nPRODUCT CATALOG (recommend by ID only, choose those that best match the user's needs):\n${productIds.map((id) => `- "${id}"`).join("\n")}\n`
    : "";

  return `You are a clinical-grade body composition assistant for a nutrition coaching app.
A user has provided a full-body photograph along with biometric data and goals.
Your job is to write qualitative insights that complement the deterministic numbers — never override them, never invent vitals, never make medical diagnoses.

CRITICAL RULES:
1. Return ONLY a valid JSON object. No text before or after.
2. Write ALL human-readable strings in ${langName}. Metric IDs and product IDs stay in English.
3. Do not contradict the formula-computed metrics provided below; reference them.
4. If the photo is unclear (cropped, blurry, dark, partial), still return all fields and note the photo limitation inside "photo_quality_note".
5. Never assess medical conditions. Frame everything as wellness observation, not diagnosis.
6. Recommend products from the catalog (if provided) that support the user's goal, their lowest-scoring metrics, AND every selected health concern listed below — as many products as their concerns require, not a fixed number.
7. "posture_note", "composition_note" and "photo_quality_note" must NEVER be empty — if something can't be judged from the photo, say so in ${langName} in that field.
8. The structured fields ("fat_distribution", "muscle_tone", "symmetry", "posture_flags", "focus_areas", "visual_body_fat") must use ONLY the allowed English values listed in the shape below — they are machine ids, never translate them. If the photo genuinely does not let you judge a field, use null (or [] for arrays) instead of guessing.
9. "visual_body_fat" is your own estimate of the body-fat percentage RANGE visible in the photo (e.g. 22–26). It may disagree with the formula estimate — that disagreement is useful signal; report what you see. Keep the range 4-6 points wide.
10. "read_confidence" (0-100) reflects how much the photo supports your read: full-body, front-on, good light ≈ 80-95; cropped/blurry/clothed-baggy ≈ 30-60.

INPUT — USER GOAL: ${formData.goal || "unspecified"}
INPUT — SELECTED HEALTH CONCERNS: ${(formData.health_conditions || []).join(", ") || "none"}
INPUT — SEX: ${formData.sex || "unspecified"} · AGE: ${computed.age ?? "unknown"}
INPUT — COMPUTED METRICS:
- BMI: ${summary.bmi ?? "n/a"} (${summary.bmiCategory ?? "n/a"})
- Body fat est.: ${summary.bodyFat ?? "n/a"}% (${summary.bodyFatCategory ?? "n/a"})
- Waist-to-hip: ${summary.whr ?? "n/a"} (${summary.whrCategory ?? "n/a"})
- BMR: ${summary.bmr ?? "n/a"} kcal · Target: ${summary.calories ?? "n/a"} kcal
- Hydration target: ${summary.hydrationTarget ?? "n/a"} L/day
- Lorentz healthy weight: ${summary.healthyWeight ?? "n/a"} kg · Current: ${summary.weightKg ?? "n/a"} kg

VISION TASK — describe what is visible in the photo:
- General posture (shoulders, hip alignment, spinal stack) — both as free text AND as structured flags
- Apparent body composition distribution (where mass is carried) — free text AND the fat_distribution id
- Visible muscle tone / definition and left-right symmetry
- Your own visual body-fat percentage range, independent of the formula estimate
- Which 1-3 areas the photo suggests focusing on first
- Photo quality, any limitations, and how confident the read is (read_confidence)

${productCatalog}

REQUIRED JSON SHAPE — follow EXACTLY:
{
  "summary": "<2-3 sentence overall body-composition summary in ${langName}>",
  "body_type": "<one of: ${VISION_ENUMS.body_type.join(" | ")}>",
  "posture_note": "<1 sentence on posture observed>",
  "composition_note": "<1 sentence on mass distribution observed>",
  "photo_quality_note": "<1 sentence on photo clarity / any limitation>",
  "visual_body_fat": { "low": <number>, "high": <number> } | null,
  "fat_distribution": "<one of: ${VISION_ENUMS.fat_distribution.join(" | ")}>" | null,
  "muscle_tone": "<one of: ${VISION_ENUMS.muscle_tone.join(" | ")}>" | null,
  "symmetry": "<one of: ${VISION_ENUMS.symmetry.join(" | ")}>" | null,
  "posture_flags": ["<zero or more of: ${VISION_ENUMS.posture_flags.join(" | ")}>"],
  "focus_areas": ["<1-3 of: ${VISION_ENUMS.focus_areas.join(" | ")}>"],
  "read_confidence": <integer 0-100>,
  "vision_insights": [
    {
      "category": "<strengths|concerns|lifestyle|goals>",
      "title": "<short title in ${langName}>",
      "points": ["<1 short observation>", "<another>", "<another>"]
    }
  ],
  "vision_tips": ["<tip>", "<tip>", "<tip>"],
  "recommendations": [
    { "product_id": "<id-from-catalog>", "priority": 1, "reason": "<1 sentence why in ${langName}>" }
  ]
}

The vision_insights array MUST contain EXACTLY 4 objects, one per category in order:
strengths, concerns, lifestyle, goals.
`;
}

export { LANG_NAMES, VISION_ENUMS };
