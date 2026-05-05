import { z } from "zod";

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  name: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  birthDate: z.string().min(1, "Required"),
  phone: z.string().regex(/^\+?[\d\s\-()]{6,20}$/, "Invalid phone number"),
  country: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
});

// Step 2: Main Goal
export const mainGoalSchema = z.object({
  skinConcerns: z.array(z.string()).min(1, "Select at least one").max(3, "Max 3"),
  skinConcernsOther: z.string().optional().default(""),
  priorityConcern: z.string().min(1, "Required"),
  improvementZones: z.array(z.string()).min(1, "Select at least one"),
});

// Step 3: Skin Perception
export const skinPerceptionSchema = z.object({
  skinType: z.string().min(1, "Required"),
  skinFeelGeneral: z.string().min(1, "Required"),
  skinFeelEndOfDay: z.string().min(1, "Required"),
});

// Step 4: Current Routine
export const currentRoutineSchema = z.object({
  routineFrequency: z.string().min(1, "Required"),
  productsUsed: z.array(z.string()).default([]),
  productsUsedOther: z.string().optional().default(""),
  essentialProduct: z.string().optional().default(""),
  missingProduct: z.string().optional().default(""),
  supplements: z.string().optional().default(""),
});

// Step 5: Sensitivity
export const sensitivitySchema = z.object({
  reactionLevel: z.string().min(1, "Required"),
  recentSigns: z.array(z.string()).default([]),
});

// Step 6: Habits
export const habitsSchema = z.object({
  sunscreenUse: z.string().min(1, "Required"),
  makeupFrequency: z.string().min(1, "Required"),
  sleepHours: z.string().min(1, "Required"),
  stressImpact: z.string().min(1, "Required"),
  waterIntake: z.string().min(1, "Required"),
});

// Step 7: Past Experience
export const pastExperienceSchema = z.object({
  treatmentHistory: z.string().min(1, "Required"),
  frustrations: z.array(z.string()).default([]),
});

// Step 8: Goals / Commercial
export const goalsCommercialSchema = z.object({
  lookingFor: z.string().min(1, "Required"),
  wantRoutineRecommendation: z.string().min(1, "Required"),
  budgetLevel: z.string().min(1, "Required"),
});

// Step 9: Photo (no form fields — image handled via state)
export const photoSchema = z.object({});

// Merged full schema
export const fullScanSchema = basicInfoSchema
  .merge(mainGoalSchema)
  .merge(skinPerceptionSchema)
  .merge(currentRoutineSchema)
  .merge(sensitivitySchema)
  .merge(habitsSchema)
  .merge(pastExperienceSchema)
  .merge(goalsCommercialSchema)
  .merge(photoSchema);

// Array of schemas indexed by step (0-8)
export const STEP_SCHEMAS = [
  basicInfoSchema,
  mainGoalSchema,
  skinPerceptionSchema,
  currentRoutineSchema,
  sensitivitySchema,
  habitsSchema,
  pastExperienceSchema,
  goalsCommercialSchema,
  photoSchema,
];

// Field names per step — used for per-step validation via trigger()
export const STEP_FIELD_NAMES = [
  ["name", "surname", "email", "birthDate", "phone", "country", "city", "consent"],
  ["skinConcerns", "skinConcernsOther", "priorityConcern", "improvementZones"],
  ["skinType", "skinFeelGeneral", "skinFeelEndOfDay"],
  ["routineFrequency", "productsUsed", "productsUsedOther", "essentialProduct", "missingProduct", "supplements"],
  ["reactionLevel", "recentSigns"],
  ["sunscreenUse", "makeupFrequency", "sleepHours", "stressImpact", "waterIntake"],
  ["treatmentHistory", "frustrations"],
  ["lookingFor", "wantRoutineRecommendation", "budgetLevel"],
  [], // Step 9: no form fields
];

// Default values for form initialization
export const DEFAULT_VALUES = {
  name: "",
  surname: "",
  email: "",
  birthDate: "",
  phone: "",
  country: "",
  city: "",
  consent: false,
  skinConcerns: [],
  skinConcernsOther: "",
  priorityConcern: "",
  improvementZones: [],
  skinType: "",
  skinFeelGeneral: "",
  skinFeelEndOfDay: "",
  routineFrequency: "",
  productsUsed: [],
  productsUsedOther: "",
  essentialProduct: "",
  missingProduct: "",
  supplements: "",
  reactionLevel: "",
  recentSigns: [],
  sunscreenUse: "",
  makeupFrequency: "",
  sleepHours: "",
  stressImpact: "",
  waterIntake: "",
  treatmentHistory: "",
  frustrations: [],
  lookingFor: "",
  wantRoutineRecommendation: "",
  budgetLevel: "",
};
