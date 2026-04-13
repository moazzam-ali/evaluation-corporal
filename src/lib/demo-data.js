export const DEMO_ANALYSIS = {
  id: "demo",
  formData: {
    name: "Sarah",
    surname: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1234567890",
    age: 28,
    skin_type: "combination",
  },
  results: {
    overall_score: 68,
    skin_type: "combination",
    metrics: [
      {
        id: "oily_skin",
        score: 42,
        status: "normal",
        insight: "Moderate oiliness detected in the T-zone area, particularly around the nose and forehead.",
      },
      {
        id: "uneven_skin_tone",
        score: 55,
        status: "normal",
        insight: "Some unevenness in skin tone with mild discoloration around the cheeks.",
      },
      {
        id: "eye_wrinkles",
        score: 72,
        status: "normal",
        insight: "Minor fine lines detected around the eye contour area, consistent with age.",
      },
      {
        id: "crows_feet",
        score: 78,
        status: "normal",
        insight: "Very faint crow's feet at the outer corners of the eyes, barely visible.",
      },
      {
        id: "radiance",
        score: 58,
        status: "normal",
        insight: "Skin appears slightly dull; a brightening routine could enhance natural glow.",
      },
      {
        id: "firmness",
        score: 82,
        status: "good",
        insight: "Excellent skin firmness and elasticity throughout the face.",
      },
      {
        id: "hydration",
        score: 55,
        status: "normal",
        insight: "Skin hydration is adequate but could benefit from a more consistent moisturising routine.",
      },
      {
        id: "dark_spots",
        score: 70,
        status: "normal",
        insight: "Even skin tone with minimal hyperpigmentation detected.",
      },
      {
        id: "smoothness",
        score: 72,
        status: "normal",
        insight: "Overall skin texture appears smooth with minor roughness around the chin area.",
      },
      {
        id: "fine_lines_wrinkles",
        score: 88,
        status: "good",
        insight: "Minimal fine lines detected. Skin shows good elasticity consistent with age.",
      },
      {
        id: "texture",
        score: 65,
        status: "normal",
        insight: "Skin texture is generally good with some visible pores in the T-zone.",
      },
      {
        id: "dark_circles",
        score: 35,
        status: "needs_attention",
        insight: "Noticeable dark circles under both eyes, possibly due to fatigue or genetics.",
      },
    ],
    recommendations: [
      {
        product_id: "eye_cream_515k",
        priority: 1,
        reason: "Your dark circles and early eye area signs indicate this targeted eye cream will provide the most immediate improvement.",
      },
      {
        product_id: "niacinamide_serum_508k",
        priority: 2,
        reason: "The 10% niacinamide will help even your skin tone, boost radiance, and minimise visible pores in the T-zone.",
      },
      {
        product_id: "gelo_cleanser_511k",
        priority: 3,
        reason: "A gentle foaming cleanser will help manage T-zone oiliness without stripping moisture — essential first step.",
      },
      {
        product_id: "tension_cream_513k",
        priority: 4,
        reason: "This day cream will boost hydration and radiance while maintaining your already excellent firmness.",
      },
    ],
    summary:
      "Your skin is in good overall condition with strong firmness and minimal wrinkles for your age. The main areas to focus on are the under-eye area, which shows dark circles, and the T-zone, which has some oiliness and visible pores. A targeted eye cream paired with a brightening serum and gentle cleanser would significantly improve your scores.",
    detailed_analysis:
      "Your skin presents a healthy foundation with several notable strengths. Firmness and elasticity are excellent, scoring well above average — this suggests good collagen production and overall structural integrity. Fine lines and wrinkles are minimal, which is consistent with your age group and indicates that your skin is ageing gracefully.\n\nThe primary area of concern is the under-eye region. Dark circles scored significantly below the healthy threshold, which can be attributed to a combination of factors including genetics, sleep patterns, and potentially insufficient hydration in the periorbital area. This is the single biggest opportunity for visible improvement in your skin's appearance.\n\nYour T-zone shows moderate oiliness with visible pores, particularly around the nose and inner cheeks. This is characteristic of combination skin and is manageable with the right cleansing routine. The cheek area, by contrast, tends slightly toward dryness, reinforcing the combination skin type diagnosis.\n\nSkin radiance and tone could benefit from targeted brightening. While there are no significant dark spots or hyperpigmentation issues, the overall luminosity is subdued — likely influenced by the uneven moisture distribution across different facial zones. A niacinamide-based treatment would address both the tone unevenness and the pore visibility simultaneously.\n\nOverall, your skin is in a strong position. With a focused routine targeting the under-eye area, T-zone balance, and overall radiance, you could see meaningful improvements within 4-6 weeks.",
    tips: [
      "Apply eye cream with your ring finger using gentle tapping motions — never pull or drag the delicate skin around the eyes.",
      "Keep your T-zone clean but avoid over-washing, which can trigger rebound oil production. Twice daily cleansing is ideal.",
      "Consider sleeping with your head slightly elevated to reduce morning puffiness and dark circle severity.",
      "Drink at least 2 litres of water daily — your hydration score suggests your skin would respond well to increased water intake.",
      "Always apply SPF 30+ during the day, even on cloudy days — this will protect your excellent firmness score and prevent future dark spots.",
    ],
    routine_note:
      "Start your morning with the Gelo Cleanser, follow with the Niacinamide Serum for brightening, then the Tension Cream for daytime moisture and firmness, and finish with the Eye Cream around the eye contour. In the evening, cleanse again and apply the Eye Cream before bed.",
  },
  imageUrl: null,
  language: "en",
  createdAt: new Date().toISOString(),
};
