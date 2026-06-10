"use client";

export default function Step3DietNutrition({ form, t }) {
  const { register, formState: { errors }, watch, setValue } = form;
  const has_breakfast = watch("has_breakfast");

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

  const YES_NO = [
    { value: "yes", label: t("scan.step3.yes", "Yes") },
    { value: "no", label: t("scan.step3.no", "No") },
  ];

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Diet type */}
      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step3.diet_type", "What kind of diet do you follow?")} <span className="text-[#9B8573] text-sm">*</span></label>
        <select className="scan-select" {...register("diet_type")}>
          <option value="">{t("scan.step3.select", "Select...")}</option>
          {DIET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.diet_type && <p className="scan-error">{errors.diet_type.message}</p>}
      </div>

      {/* Meals per day */}
      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step3.meals_per_day", "How many meals a day do you eat?")} <span className="text-[#9B8573] text-sm">*</span></label>
        <select className="scan-select" {...register("meals_per_day")}>
          <option value="">{t("scan.step3.select", "Select...")}</option>
          {MEALS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.meals_per_day && <p className="scan-error">{errors.meals_per_day.message}</p>}
      </div>

      {/* Breakfast */}
      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step3.has_breakfast", "Do you usually have breakfast?")} <span className="text-[#9B8573] text-sm">*</span></label>
        <div className="flex flex-wrap gap-2">
          {YES_NO.map((opt) => (
            <label
              key={opt.value}
              className={`scan-radio ${has_breakfast === opt.value ? "is-checked" : ""}`}
              onClick={() => setValue("has_breakfast", opt.value, { shouldValidate: true })}
            >
              <span className="scan-radio-dot" />
              {opt.label}
              <input type="radio" className="sr-only" value={opt.value} {...register("has_breakfast")} />
            </label>
          ))}
        </div>
        {errors.has_breakfast && <p className="scan-error">{errors.has_breakfast.message}</p>}
      </div>

      {/* Conditional: breakfast description */}
      {has_breakfast === "yes" && (
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step3.breakfast_description", "What kind of breakfast do you usually have?")}</label>
          <textarea className="scan-textarea" placeholder={t("scan.step3.breakfast_description_placeholder", "Briefly explain the combination of foods you usually eat.")} {...register("breakfast_description")} />
        </div>
      )}
    </div>
  );
}
