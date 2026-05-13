"use client";

import { useEffect } from "react";

export default function Step3HabitsInfo({ form, t }) {
  const { register, formState: { errors }, watch, setValue } = form;
  const has_breakfast = watch("has_breakfast");
  const has_skincare_routine = watch("has_skincare_routine");
  const health_conditions = watch("health_conditions") || [];

  const toggleCondition = (val) => {
    const current = health_conditions || [];
    if (current.includes(val)) {
      setValue("health_conditions", current.filter((v) => v !== val), { shouldValidate: true });
    } else {
      setValue("health_conditions", [...current, val], { shouldValidate: true });
    }
  };

  const DIET_OPTIONS = [
    { value: "omnivore", label: t("scan.step3.diet_type_options.omnivore", "Omnivore (eats everything)") },
    { value: "vegetarian", label: t("scan.step3.diet_type_options.vegetarian", "Vegetarian (plant-based, eggs, dairy)") },
    { value: "vegan", label: t("scan.step3.diet_type_options.vegan", "Vegan (only plant-based foods)") },
  ];

  const MEALS_OPTIONS = [
    { value: "less_than_3", label: t("scan.step3.meals_per_day_options.less_than_3", "Less than 3") },
    { value: "between_3_and_5", label: t("scan.step3.meals_per_day_options.between_3_and_5", "Between 3 and 5") },
    { value: "more_than_5", label: t("scan.step3.meals_per_day_options.more_than_5", "More than 5") },
  ];

  const CONDITION_OPTIONS = [
    "low_bone_density", "constipation", "athlete_supplements", "high_cholesterol",
    "few_vegetables", "low_energy", "trouble_sleeping", "poor_mental_agility",
    "inflammation", "skin_cellulite", "little_water", "demanding_job",
    "belly_fat", "circulation_problems",
  ];

  const EXERCISE_LEVEL_OPTIONS = [
    { value: "little", label: t("scan.step3.exercise_level_options.little", "Little or no exercise / Office work") },
    { value: "light", label: t("scan.step3.exercise_level_options.light", "Physical exercise 1-3 days/week") },
    { value: "moderate", label: t("scan.step3.exercise_level_options.moderate", "Physical exercise 3-5 days/week") },
    { value: "active", label: t("scan.step3.exercise_level_options.active", "Physical exercise 6-7 days/week") },
    { value: "very_active", label: t("scan.step3.exercise_level_options.very_active", "Exercise twice a day") },
  ];

  const EXERCISE_DURATION_OPTIONS = [
    { value: "never", label: t("scan.step3.exercise_duration_options.never", "Never exercised") },
    { value: "less_than_6", label: t("scan.step3.exercise_duration_options.less_than_6", "Less than 6 months") },
    { value: "6_to_12", label: t("scan.step3.exercise_duration_options.6_to_12", "Between 6 and 12 months") },
    { value: "more_than_12", label: t("scan.step3.exercise_duration_options.more_than_12", "More than 12 months") },
  ];

  const WATER_OPTIONS = [
    { value: "less_than_2", label: t("scan.step3.water_intake_options.less_than_2", "Less than 2 liters a day") },
    { value: "about_2", label: t("scan.step3.water_intake_options.about_2", "Around 2 liters a day") },
    { value: "more_than_2", label: t("scan.step3.water_intake_options.more_than_2", "More than 2 liters a day") },
  ];

  const GOAL_OPTIONS = [
    { value: "weight_control", label: t("scan.step3.goal_options.weight_control", "Control my weight and reduce body fat") },
    { value: "maintain_care", label: t("scan.step3.goal_options.maintain_care", "Maintain my weight, take better care of myself") },
    { value: "gain_weight", label: t("scan.step3.goal_options.gain_weight", "Increase weight and/or muscle mass") },
  ];

  const YES_NO = [
    { value: "yes", label: t("scan.step3.yes", "Yes") },
    { value: "no", label: t("scan.step3.no", "No") },
  ];

  const renderSelect = (name, label, options, selectPlaceholder) => (
    <div className="flex flex-col gap-1.5">
      <label className="scan-label">{label} <span className="text-[#2C5BFF] text-sm">*</span></label>
      <select className="scan-select" {...register(name)}>
        <option value="">{selectPlaceholder || t("scan.step3.select", "Select...")}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {errors[name] && <p className="scan-error">{errors[name].message}</p>}
    </div>
  );

  const renderRadioGroup = (name, label, options) => (
    <div className="flex flex-col gap-2">
      <label className="scan-label">{label} <span className="text-[#2C5BFF] text-sm">*</span></label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`scan-radio ${watch(name) === opt.value ? "is-checked" : ""}`}
            onClick={() => setValue(name, opt.value, { shouldValidate: true })}
          >
            <span className="scan-radio-dot" />
            {opt.label}
            <input type="radio" className="sr-only" value={opt.value} {...register(name)} />
          </label>
        ))}
      </div>
      {errors[name] && <p className="scan-error">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Diet type */}
      {renderSelect("diet_type", t("scan.step3.diet_type", "What kind of diet do you follow?"), DIET_OPTIONS)}

      {/* Meals per day */}
      {renderSelect("meals_per_day", t("scan.step3.meals_per_day", "How many meals a day do you eat?"), MEALS_OPTIONS)}

      {/* Breakfast */}
      {renderRadioGroup("has_breakfast", t("scan.step3.has_breakfast", "Do you usually have breakfast?"), YES_NO)}

      {has_breakfast === "yes" && (
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step3.breakfast_description", "What kind of breakfast do you usually have?")}</label>
          <textarea className="scan-textarea" placeholder={t("scan.step3.breakfast_description_placeholder", "Briefly explain the combination of foods you usually eat.")} {...register("breakfast_description")} />
        </div>
      )}

      {/* Health conditions */}
      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step3.health_conditions", "Select one or more conditions:")}</label>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((cond) => (
            <button
              key={cond}
              type="button"
              className={`scan-chip ${health_conditions.includes(cond) ? "is-checked" : ""}`}
              onClick={() => toggleCondition(cond)}
            >
              <span className="scan-chip-tick">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {t(`scan.step3.health_conditions_options.${cond}`, cond.replace(/_/g, " "))}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise level */}
      {renderSelect("exercise_level", t("scan.step3.exercise_level", "What is your level of physical exercise?"), EXERCISE_LEVEL_OPTIONS)}

      {/* Exercise duration */}
      {renderSelect("exercise_duration", t("scan.step3.exercise_duration", "How long have you been exercising?"), EXERCISE_DURATION_OPTIONS)}

      {/* Water intake */}
      {renderSelect("water_intake", t("scan.step3.water_intake", "How many liters of water per day?"), WATER_OPTIONS)}

      {/* Goal */}
      {renderSelect("goal", t("scan.step3.goal", "What goal would you like to achieve?"), GOAL_OPTIONS)}

      {/* Weight at ideal age */}
      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step3.weight_at_ideal_age", "Realistically, at what weight would you feel good?")} <span className="text-[#2C5BFF] text-sm">*</span></label>
        <input className="scan-input" type="number" step="0.1" placeholder={t("scan.step3.weight_at_ideal_age_placeholder", "Enter the weight (kg)")} {...register("weight_at_ideal_age")} />
        {errors.weight_at_ideal_age && <p className="scan-error">{errors.weight_at_ideal_age.message}</p>}
      </div>

      {/* Skincare routine */}
      {renderRadioGroup("has_skincare_routine", t("scan.step3.has_skincare_routine", "Do you have a daily skincare, body, or hair care routine?"), YES_NO)}

      {has_skincare_routine === "yes" && (
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step3.skincare_products", "What kind of products do you use?")}</label>
          <textarea className="scan-textarea" placeholder={t("scan.step3.skincare_products_placeholder", "Briefly describe your products.")} {...register("skincare_products")} />
        </div>
      )}

      {/* Facial evaluation */}
      {renderRadioGroup("want_facial_evaluation", t("scan.step3.want_facial_evaluation", "Would you like a free facial assessment?"), YES_NO)}

      {/* Privacy policy */}
      <div className="flex items-start gap-3 rounded-xl border border-[rgba(11,27,51,0.10)] bg-[#F8FAFE] p-4">
        <input
          type="checkbox"
          id="privacy_policy"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#2C5BFF] cursor-pointer"
          {...register("privacy_policy")}
        />
        <label htmlFor="privacy_policy" className="text-[12.5px] leading-relaxed text-[#44444F] cursor-pointer" style={{ fontFamily: "var(--font-inter)" }}>
          {t("scan.step3.privacy_policy", "I accept the Privacy Policy")}
          {" "}
          <a href="/privacy" target="_blank" className="text-[#2C5BFF] underline underline-offset-2 hover:text-[#1F44CC]">
            {t("scan.step3.privacy_policy_link", "Read our Privacy Policy")}
          </a>
          {" "}
          <span className="text-[#2C5BFF]">*</span>
        </label>
      </div>
      {errors.privacy_policy && <p className="scan-error">{errors.privacy_policy.message}</p>}

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-[#5A6B85]" style={{ fontFamily: "var(--font-inter)" }}>
        {t("scan.step3.disclaimer", "This self-assessment is not intended for diagnostic or therapeutic purposes. It is for informational purposes only and does not replace in any case the evaluation of a healthcare professional.")}
      </p>
    </div>
  );
}
