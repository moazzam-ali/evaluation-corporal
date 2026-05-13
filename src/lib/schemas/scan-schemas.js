import { z } from "zod";

// Step 1: Personal Info
export const personalInfoSchema = z.object({
  name: z.string().min(1, "Required"),
  surname: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  birthDate: z.string().min(1, "Required"),
  phone: z.string().regex(/^\+?[\d\s\-()]{6,20}$/, "Invalid phone number"),
  country: z.string().min(1, "Required"),
  province: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
});

// Step 2: Physical Info
export const physicalInfoSchema = z.object({
  sex: z.string().min(1, "Required"),
  weight: z.coerce.number().min(20, "Min 20 kg").max(500, "Max 500 kg"),
  height: z.coerce.number().min(50, "Min 50 cm").max(300, "Max 300 cm"),
  waist: z.coerce.number().min(30, "Min 30 cm").max(200, "Max 200 cm"),
  hip: z.coerce.number().min(50, "Min 50 cm").max(250, "Max 250 cm"),
});

// Step 3: Diet & Nutrition
export const dietNutritionSchema = z.object({
  diet_type: z.string().min(1, "Required"),
  meals_per_day: z.string().min(1, "Required"),
  has_breakfast: z.string().min(1, "Required"),
  breakfast_description: z.string().optional().default(""),
});

// Step 4: Activity & Hydration
export const activityHydrationSchema = z.object({
  exercise_level: z.string().min(1, "Required"),
  exercise_duration: z.string().min(1, "Required"),
  water_intake: z.string().min(1, "Required"),
});

// Step 5: Health Conditions
export const healthConditionsSchema = z.object({
  health_conditions: z.array(z.string()).default([]),
});

// Step 6: Goals & Care
export const goalsCareSchema = z.object({
  goal: z.string().min(1, "Required"),
  weight_at_ideal_age: z.coerce.number().min(20, "Min 20 kg").max(300, "Max 300 kg"),
  has_skincare_routine: z.string().min(1, "Required"),
  skincare_products: z.string().optional().default(""),
  want_facial_evaluation: z.string().min(1, "Required"),
  privacy_policy: z.literal(true, { errorMap: () => ({ message: "You must accept the privacy policy" }) }),
});

// Step 7: Final Submission (review only)
export const finalSubmissionSchema = z.object({});

// Merged full schema
export const fullScanSchema = personalInfoSchema
  .merge(physicalInfoSchema)
  .merge(dietNutritionSchema)
  .merge(activityHydrationSchema)
  .merge(healthConditionsSchema)
  .merge(goalsCareSchema)
  .merge(finalSubmissionSchema);

// Array of schemas indexed by step (0-6)
export const STEP_SCHEMAS = [
  personalInfoSchema,
  physicalInfoSchema,
  dietNutritionSchema,
  activityHydrationSchema,
  healthConditionsSchema,
  goalsCareSchema,
  finalSubmissionSchema,
];

// Field names per step — used for per-step validation via trigger()
export const STEP_FIELD_NAMES = [
  ["name", "surname", "email", "birthDate", "phone", "country", "province", "city"],
  ["sex", "weight", "height", "waist", "hip"],
  ["diet_type", "meals_per_day", "has_breakfast", "breakfast_description"],
  ["exercise_level", "exercise_duration", "water_intake"],
  ["health_conditions"],
  ["goal", "weight_at_ideal_age", "has_skincare_routine", "skincare_products", "want_facial_evaluation", "privacy_policy"],
  [],
];

// Default values for form initialization
export const DEFAULT_VALUES = {
  name: "",
  surname: "",
  email: "",
  birthDate: "",
  phone: "",
  country: "",
  province: "",
  city: "",
  sex: "",
  weight: "",
  height: "",
  waist: "",
  hip: "",
  diet_type: "",
  meals_per_day: "",
  has_breakfast: "",
  breakfast_description: "",
  exercise_level: "",
  exercise_duration: "",
  water_intake: "",
  health_conditions: [],
  goal: "",
  weight_at_ideal_age: "",
  has_skincare_routine: "",
  skincare_products: "",
  want_facial_evaluation: "",
  privacy_policy: false,
};
