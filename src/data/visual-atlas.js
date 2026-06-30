// Visual Atlas — the coach education image catalog.
// Data-driven: the screen renders whatever is here, filtered by View × Sex.
// Images live under /public/stages (existing male external set) and /public/atlas
// (everything new). Any missing image falls back to the StageStrip silhouette,
// so the screen works before the assets are generated and upgrades as they land.

// label = i18n key + English fallback. sub stays a short, language-neutral range.
const S = (key, labelKey, labelEn, sub, img, scaleX) => ({ key, labelKey, labelEn, sub, img, scaleX });

export const ATLAS_VIEWS = [
  { id: "external", labelKey: "atlas.view_external", labelEn: "External" },
  { id: "internal", labelKey: "atlas.view_internal", labelEn: "Internals" },
  { id: "cross_section", labelKey: "atlas.view_cross", labelEn: "Cross-section" },
  { id: "facial", labelKey: "atlas.view_facial", labelEn: "Facial signs" },
  { id: "facial_fat", labelKey: "atlas.view_facialfat", labelEn: "Facial fat" },
  { id: "posture", labelKey: "atlas.view_posture", labelEn: "Posture" },
];

export const ATLAS_SEXES = [
  { id: "male", labelKey: "atlas.sex_male", labelEn: "Male" },
  { id: "female", labelKey: "atlas.sex_female", labelEn: "Female" },
];

/* ── external stage label/sub helpers (reuse existing rd.* translations) ── */
const BF = (sex, base) => [
  S("essential", "rd.bf_essential", "Essential", "2–8%", `${base}-essential.webp`, 0.80),
  S("athletic", "rd.bf_athletic", "Athletic", "8–14%", `${base}-athletic.webp`, 0.90),
  S("fitness", "rd.bf_fitness", "Fitness", "14–18%", `${base}-fitness.webp`, 1.00),
  S("average", "rd.bf_average", "Average", "18–25%", `${base}-average.webp`, 1.12),
  S("high", "rd.bf_high", "High", "25%+", `${base}-high.webp`, 1.26),
];
const BMI = (base) => [
  S("under", "rd.bmi_under", "Underweight", "<18.5", `${base}-under.webp`, 0.82),
  S("healthy", "rd.bmi_healthy", "Healthy", "18.5–25", `${base}-healthy.webp`, 0.98),
  S("over", "rd.bmi_over", "Overweight", "25–30", `${base}-over.webp`, 1.14),
  S("obese", "rd.bmi_obese", "Obese", "30+", `${base}-obese.webp`, 1.30),
];
const WHR = (base) => [
  S("low", "rd.whr_low", "Low risk", "<0.90", `${base}-low.webp`, 0.92),
  S("moderate", "rd.whr_moderate", "Moderate", "0.90–0.95", `${base}-moderate.webp`, 1.08),
  S("high", "rd.whr_high", "High risk", "0.95+", `${base}-high.webp`, 1.24),
];

const VISCERAL = (sex) => [
  S("minimal", "atlas.stage_visc_minimal", "Minimal", null, `/atlas/internal-${sex}-minimal.webp`, 0.85),
  S("low", "atlas.stage_visc_low", "Low", null, `/atlas/internal-${sex}-low.webp`, 0.95),
  S("moderate", "atlas.stage_visc_moderate", "Moderate", null, `/atlas/internal-${sex}-moderate.webp`, 1.08),
  S("high", "atlas.stage_visc_high", "High", null, `/atlas/internal-${sex}-high.webp`, 1.20),
  S("severe", "atlas.stage_visc_severe", "Severe", null, `/atlas/internal-${sex}-severe.webp`, 1.32),
];
const LAYERS = (sex) => [
  S("lean", "atlas.stage_layer_lean", "Lean", null, `/atlas/cross-${sex}-lean.webp`, 0.9),
  S("average", "atlas.stage_layer_average", "Average", null, `/atlas/cross-${sex}-average.webp`, 1.05),
  S("high", "atlas.stage_layer_high", "High", null, `/atlas/cross-${sex}-high.webp`, 1.25),
];
const FACIAL = (sex) => [
  S("vibrant", "atlas.stage_face_vibrant", "Vibrant", null, `/atlas/facial-${sex}-vibrant.webp`, 1),
  S("balanced", "atlas.stage_face_balanced", "Balanced", null, `/atlas/facial-${sex}-balanced.webp`, 1),
  S("fatigued", "atlas.stage_face_fatigued", "Fatigued", null, `/atlas/facial-${sex}-fatigued.webp`, 1),
  S("depleted", "atlas.stage_face_depleted", "Depleted", null, `/atlas/facial-${sex}-depleted.webp`, 1),
];
// Facial fat / leanness — how the face reshapes across the body-fat range.
// Reuses the rd.bf_* band labels; images are head-and-shoulders portraits.
const FACE_FAT = (sex) => [
  S("essential", "rd.bf_essential", "Essential", "2–8%", `/atlas/facialfat-${sex}-essential.webp`, 1),
  S("athletic", "rd.bf_athletic", "Athletic", "8–14%", `/atlas/facialfat-${sex}-athletic.webp`, 1),
  S("fitness", "rd.bf_fitness", "Fitness", "14–18%", `/atlas/facialfat-${sex}-fitness.webp`, 1),
  S("average", "rd.bf_average", "Average", "18–25%", `/atlas/facialfat-${sex}-average.webp`, 1),
  S("high", "rd.bf_high", "High", "25%+", `/atlas/facialfat-${sex}-high.webp`, 1),
];
const POSTURE = (sex) => [
  S("aligned", "atlas.stage_pose_aligned", "Aligned", null, `/atlas/posture-${sex}-aligned.webp`, 1),
  S("rounded", "atlas.stage_pose_rounded", "Rounded", null, `/atlas/posture-${sex}-rounded.webp`, 1),
  S("tilted", "atlas.stage_pose_tilted", "Tilted", null, `/atlas/posture-${sex}-tilted.webp`, 1),
];

const C = (id, view, sex, titleKey, titleEn, captionKey, captionEn, stages) =>
  ({ id, view, sex, titleKey, titleEn, captionKey, captionEn, stages });

export const ATLAS_COLLECTIONS = [
  // ── External ──
  C("bf-ext-male", "external", "male", "atlas.topic_bodyfat", "Body fat", "atlas.cap_bodyfat",
    "How the same body reads across the male body-fat range — same height and weight, different composition.", BF("male", "/stages/bodyfat")),
  C("bmi-ext-male", "external", "male", "atlas.topic_bmi", "Body Mass Index", "atlas.cap_bmi",
    "The broad external shape each BMI band tends to produce — BMI can't see muscle.", BMI("/stages/bmi")),
  C("whr-ext-male", "external", "male", "atlas.topic_whr", "Waist-to-hip", "atlas.cap_whr",
    "Where fat sits. Lower waist-to-hip ratios carry less cardiometabolic risk.", WHR("/stages/whr")),
  C("bf-ext-female", "external", "female", "atlas.topic_bodyfat", "Body fat", "atlas.cap_bodyfat",
    "How the same body reads across the female body-fat range — same height and weight, different composition.", BF("female", "/atlas/external-female-bodyfat")),
  C("bmi-ext-female", "external", "female", "atlas.topic_bmi", "Body Mass Index", "atlas.cap_bmi",
    "The broad external shape each BMI band tends to produce — BMI can't see muscle.", BMI("/atlas/external-female-bmi")),
  C("whr-ext-female", "external", "female", "atlas.topic_whr", "Waist-to-hip", "atlas.cap_whr",
    "Where fat sits. Lower waist-to-hip ratios carry less cardiometabolic risk.", WHR("/atlas/external-female-whr")),

  // ── Internal / visceral ──
  C("visc-male", "internal", "male", "atlas.topic_visceral", "Visceral fat", "atlas.cap_visceral",
    "A see-through view of the midsection: golden visceral fat builds around the organs as the stage worsens — the fat that matters most for health.", VISCERAL("male")),
  C("visc-female", "internal", "female", "atlas.topic_visceral", "Visceral fat", "atlas.cap_visceral",
    "A see-through view of the midsection: golden visceral fat builds around the organs as the stage worsens — the fat that matters most for health.", VISCERAL("female")),

  // ── Cross-section ──
  C("cross-male", "cross_section", "male", "atlas.topic_layers", "Fat layers", "atlas.cap_layers",
    "A cutaway through the abdominal wall — skin, subcutaneous fat, muscle, then visceral fat — thickening from lean to high.", LAYERS("male")),
  C("cross-female", "cross_section", "female", "atlas.topic_layers", "Fat layers", "atlas.cap_layers",
    "A cutaway through the abdominal wall — skin, subcutaneous fat, muscle, then visceral fat — thickening from lean to high.", LAYERS("female")),

  // ── Facial vitality ──
  C("face-male", "facial", "male", "atlas.topic_facial", "Facial vitality", "atlas.cap_facial",
    "Visible signs of wellness in the face — hydration, skin radiance, under-eye freshness — from vibrant to depleted.", FACIAL("male")),
  C("face-female", "facial", "female", "atlas.topic_facial", "Facial vitality", "atlas.cap_facial",
    "Visible signs of wellness in the face — hydration, skin radiance, under-eye freshness — from vibrant to depleted.", FACIAL("female")),

  // ── Facial fat / leanness ──
  C("facefat-male", "facial_fat", "male", "atlas.topic_facialfat", "Facial fat & leanness", "atlas.cap_facialfat",
    "How the face reshapes across the body-fat range — fuller cheeks and a softer jaw at higher fat, sharper cheekbones and a defined jawline as it drops.", FACE_FAT("male")),
  C("facefat-female", "facial_fat", "female", "atlas.topic_facialfat", "Facial fat & leanness", "atlas.cap_facialfat",
    "How the face reshapes across the body-fat range — fuller cheeks and a softer jaw at higher fat, sharper cheekbones and a defined jawline as it drops.", FACE_FAT("female")),

  // ── Posture ──
  C("pose-male", "posture", "male", "atlas.topic_posture", "Posture", "atlas.cap_posture",
    "Alignment patterns from the side — neutral stack vs. rounded shoulders vs. anterior pelvic tilt.", POSTURE("male")),
  C("pose-female", "posture", "female", "atlas.topic_posture", "Posture", "atlas.cap_posture",
    "Alignment patterns from the side — neutral stack vs. rounded shoulders vs. anterior pelvic tilt.", POSTURE("female")),
];
