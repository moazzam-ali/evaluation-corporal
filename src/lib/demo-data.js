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
    insights: [
      {
        category: "strengths",
        title: "Your Skin Strengths",
        points: [
          "Excellent firmness and elasticity — suggests healthy collagen production and structural integrity.",
          "Minimal fine lines and wrinkles, consistent with your age group — your skin is ageing gracefully.",
          "No significant hyperpigmentation or dark spots — your base skin tone is even and healthy.",
        ],
      },
      {
        category: "concerns",
        title: "Areas to Focus On",
        points: [
          "Dark circles under both eyes scored well below the healthy threshold — this is your biggest improvement opportunity.",
          "T-zone oiliness with visible pores around the nose and inner cheeks, characteristic of combination skin.",
          "Overall skin radiance is subdued — luminosity could be boosted with a targeted brightening routine.",
        ],
      },
      {
        category: "lifestyle",
        title: "Lifestyle Observations",
        points: [
          "Under-eye darkness suggests possible sleep deficiency or high screen time before bed.",
          "Hydration levels indicate you may not be drinking enough water throughout the day.",
          "The uneven moisture distribution (oily T-zone, drier cheeks) points to environmental stress or inconsistent skincare habits.",
        ],
      },
      {
        category: "goals",
        title: "Based on Your Goals",
        points: [
          "A targeted eye cream will address your most visible concern — expect noticeable improvement within 2-3 weeks of consistent use.",
          "A niacinamide serum will simultaneously tackle pore visibility, tone unevenness, and radiance.",
          "With a focused 4-step routine, you could see meaningful overall improvement within 4-6 weeks.",
        ],
      },
    ],
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
