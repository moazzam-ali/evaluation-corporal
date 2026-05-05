"use client";

const LOOKING_FOR_OPTIONS = ["basic_routine", "complete_routine", "specific_problem", "prevention", "personalized_advice"];
const WANT_RECOMMENDATION_OPTIONS = ["yes", "no"];
const BUDGET_OPTIONS = ["basic", "medium", "premium"];

export default function Step8GoalsCommercial({ form, t }) {
  const { watch, setValue, formState: { errors } } = form;

  const fields = [
    { name: "lookingFor", label: t("scan.step8.looking_for_label", "What are you looking for right now?"), options: LOOKING_FOR_OPTIONS, prefix: "scan.step8.looking_for", cols: "" },
    { name: "wantRoutineRecommendation", label: t("scan.step8.recommendation_label", "Would you like us to recommend a routine tailored to your skin and goal?"), options: WANT_RECOMMENDATION_OPTIONS, prefix: "scan.step8.recommendation", cols: "sm:grid-cols-2" },
    { name: "budgetLevel", label: t("scan.step8.budget_label", "What level of investment is comfortable for you each month?"), options: BUDGET_OPTIONS, prefix: "scan.step8.budget", cols: "" },
  ];

  return (
    <div className="flex flex-col gap-[22px]">
      {fields.map(({ name, label, options, prefix, cols }) => (
        <div key={name} className="flex flex-col gap-2">
          <label className="scan-label">{label}</label>
          <div className={`grid gap-2 ${cols}`}>
            {options.map((key) => (
              <label key={key} className={`scan-radio ${watch(name) === key ? "is-checked" : ""}`} onClick={() => setValue(name, key, { shouldValidate: true })}>
                <input type="radio" checked={watch(name) === key} onChange={() => setValue(name, key, { shouldValidate: true })} className="sr-only" />
                <span className="scan-radio-dot" />
                <span>{t(`${prefix}.${key}`, key)}</span>
              </label>
            ))}
          </div>
          {errors[name] && <p className="scan-error">{errors[name].message}</p>}
        </div>
      ))}
    </div>
  );
}
