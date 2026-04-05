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
  "uneven_skin_tone",
  "eye_wrinkles",
  "crows_feet",
  "radiance",
  "firmness",
  "hydration",
  "dark_spots",
  "smoothness",
  "fine_lines_wrinkles",
  "texture",
  "dark_circles",
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
6. The "status" field MUST be exactly one of: "good" (score >= 80), "normal" (score 40-79), "needs_attention" (score < 40).
7. Recommend 1-4 products from the catalog based on the lowest-scoring metrics.

THE 12 METRICS (you must include ALL of these, in this exact order):
1. oily_skin — Sebum/oil balance (100=balanced, 0=extremely oily)
2. uneven_skin_tone — Irregularities in skin color such as redness, dull areas, patches of discoloration (100=perfectly even, 0=very uneven)
3. eye_wrinkles — Wrinkles around the eye contour area (100=smooth, 0=deep wrinkles)
4. crows_feet — Fine lines at the outer corners of the eyes (100=none, 0=very pronounced)
5. radiance — Glow, freshness, luminosity (100=radiant, 0=dull)
6. firmness — Tightness, elasticity, resilience (100=very firm, 0=saggy)
7. hydration — Moisture level, plumpness (100=well-hydrated, 0=very dry)
8. dark_spots — Pigmentation marks, areas of discoloration (100=even tone, 0=many spots)
9. smoothness — Surface softness and evenness (100=smooth, 0=rough)
10. fine_lines_wrinkles — Expression lines and wrinkles across the face (100=none, 0=deep wrinkles)
11. texture — Overall condition and consistency of the skin's surface (100=refined, 0=uneven)
12. dark_circles — Darkness under the eyes (100=bright, 0=very dark)

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
