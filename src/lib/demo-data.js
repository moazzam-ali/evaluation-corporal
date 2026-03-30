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
        id: "moisture",
        score: 55,
        status: "normal",
        insight: "Skin hydration is adequate but could benefit from a more consistent moisturizing routine.",
      },
      {
        id: "texture",
        score: 72,
        status: "good",
        insight: "Overall skin texture appears smooth with minor roughness around the chin area.",
      },
      {
        id: "wrinkles",
        score: 88,
        status: "good",
        insight: "Minimal fine lines detected. Skin shows good elasticity consistent with age.",
      },
      {
        id: "dark_circles",
        score: 35,
        status: "needs_attention",
        insight: "Noticeable dark circles under both eyes, possibly due to fatigue or genetics.",
      },
      {
        id: "redness",
        score: 61,
        status: "normal",
        insight: "Mild redness observed around the cheeks and nose, consistent with slight sensitivity.",
      },
      {
        id: "pores",
        score: 48,
        status: "normal",
        insight: "Visible pores in the T-zone area, particularly around the nose and inner cheeks.",
      },
      {
        id: "firmness",
        score: 82,
        status: "good",
        insight: "Excellent skin firmness and elasticity throughout the face.",
      },
      {
        id: "radiance",
        score: 58,
        status: "normal",
        insight: "Skin appears slightly dull; a brightening routine could enhance natural glow.",
      },
      {
        id: "acne",
        score: 75,
        status: "good",
        insight: "Mostly clear skin with a few minor blemishes on the forehead.",
      },
      {
        id: "dark_spots",
        score: 70,
        status: "good",
        insight: "Even skin tone with minimal hyperpigmentation detected.",
      },
      {
        id: "eye_area",
        score: 38,
        status: "needs_attention",
        insight: "The eye area shows signs of fatigue with dark circles and slight puffiness.",
      },
    ],
    recommendations: [
      {
        product_id: "eye_renewal",
        priority: 1,
        reason: "Your eye area score indicates dark circles and puffiness that this cream specifically targets.",
      },
      {
        product_id: "hydra_boost",
        priority: 2,
        reason: "Boosting hydration will improve your moisture levels and overall skin radiance.",
      },
      {
        product_id: "pore_refiner",
        priority: 3,
        reason: "A pore minimizing treatment will help reduce visible pores in your T-zone.",
      },
      {
        product_id: "daily_glow_cream",
        priority: 4,
        reason: "A daily moisturizer with radiance-boosting ingredients will combat dullness.",
      },
    ],
    summary:
      "Your skin is in good overall condition with strong firmness and minimal wrinkles for your age. The main areas to focus on are the under-eye area, which shows dark circles and puffiness, and the T-zone, which has some oiliness and visible pores. A targeted eye cream and consistent hydration routine would significantly improve your scores.",
  },
  imageUrl: null,
  language: "en",
  createdAt: new Date().toISOString(),
};
