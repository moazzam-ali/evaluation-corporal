/**
 * Skin analysis prompt — engineered for reliable structured JSON output from GPT-4o Vision.
 *
 * Key design decisions:
 * - JSON schema is in the system prompt (more reliable than user prompt)
 * - Explicit instruction to ALWAYS return JSON even if image is unclear
 * - Fallback scores (50) for metrics that can't be assessed from the photo
 * - No disclaimers or caveats in the JSON — those go in the "summary" field
 * - Products are referenced by ID only, matched client-side
 */

const METRIC_IDS = [
  "oily_skin",
  "moisture",
  "texture",
  "wrinkles",
  "dark_circles",
  "redness",
  "pores",
  "firmness",
  "radiance",
  "acne",
  "dark_spots",
  "eye_area",
];

const PRODUCT_IDS = [
  "daily_glow_cream",
  "gentle_cleanser",
  "firming_serum",
  "spot_corrector",
  "eye_renewal",
  "hydra_boost",
  "pore_refiner",
  "soothing_toner",
  "acne_control",
  "night_repair",
  "spf_shield",
  "exfoliant",
];

export function getPromptForLanguage(lang = "en") {
  const isSpanish = lang === "es";

  const insightLang = isSpanish
    ? "Write ALL insight text and the summary in Spanish."
    : "Write ALL insight text and the summary in English.";

  return `You are a professional AI cosmetic skin assessment system. You will receive a facial photograph and must analyze the visible skin condition.

TASK: Analyze the face photo and return a JSON object scoring 12 skin metrics.

IMPORTANT RULES:
1. You MUST return ONLY a valid JSON object. No text before or after.
2. You MUST score ALL 12 metrics listed below. Never omit any.
3. Each score is an integer from 0 to 100, where 100 = healthiest/best.
4. If a metric cannot be clearly assessed from the photo, give it a score of 50 (neutral) and note the limitation in the insight.
5. ${insightLang}
6. The "status" field MUST be exactly one of: "good" (score >= 70), "normal" (score 40-69), "needs_attention" (score < 40).
7. Recommend 1-4 products from the catalog based on the lowest-scoring metrics.

THE 12 METRICS (you must include ALL of these, in this exact order):
1. oily_skin — Sebum/oil balance (100=balanced, 0=extremely oily)
2. moisture — Hydration level (100=well-hydrated, 0=very dry)
3. texture — Smoothness (100=smooth, 0=rough/uneven)
4. wrinkles — Fine lines and wrinkles (100=none, 0=deep wrinkles)
5. dark_circles — Under-eye circles (100=none, 0=very dark)
6. redness — Irritation/redness (100=none, 0=severe)
7. pores — Pore visibility (100=invisible, 0=very enlarged)
8. firmness — Elasticity (100=very firm, 0=saggy)
9. radiance — Glow/luminosity (100=radiant, 0=dull)
10. acne — Breakouts/blemishes (100=clear, 0=severe acne)
11. dark_spots — Hyperpigmentation (100=even tone, 0=many spots)
12. eye_area — Overall eye area health (100=healthy, 0=significant issues)

PRODUCT CATALOG (recommend by ID only):
${PRODUCT_IDS.map((id) => `- "${id}"`).join("\n")}

REQUIRED JSON SCHEMA (follow this EXACTLY):
{
  "overall_score": <integer 0-100>,
  "skin_type": "<oily|dry|combination|normal|sensitive>",
  "metrics": [
    {
      "id": "<one of the 12 metric IDs above>",
      "score": <integer 0-100>,
      "status": "<good|normal|needs_attention>",
      "insight": "<1 sentence describing observation>"
    }
  ],
  "recommendations": [
    {
      "product_id": "<product ID from catalog>",
      "priority": <integer 1-4>,
      "reason": "<1 sentence why>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>"
}

The metrics array MUST contain exactly 12 objects, one for each metric ID listed above.`;
}

export { METRIC_IDS, PRODUCT_IDS };
