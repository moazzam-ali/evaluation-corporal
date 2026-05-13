"use client";

export default function Step4ActivityHydration({ form, t }) {
  const { register, formState: { errors } } = form;

  const EXERCISE_LEVEL_OPTIONS = [
    { value: "little", label: t("scan.step4.exercise_level_options.little", "Little or no exercise / Office work") },
    { value: "light", label: t("scan.step4.exercise_level_options.light", "Physical exercise 1-3 days/week") },
    { value: "moderate", label: t("scan.step4.exercise_level_options.moderate", "Physical exercise 3-5 days/week") },
    { value: "active", label: t("scan.step4.exercise_level_options.active", "Physical exercise 6-7 days/week") },
    { value: "very_active", label: t("scan.step4.exercise_level_options.very_active", "Exercise twice a day") },
  ];

  const EXERCISE_DURATION_OPTIONS = [
    { value: "never", label: t("scan.step4.exercise_duration_options.never", "Never exercised") },
    { value: "less_than_6", label: t("scan.step4.exercise_duration_options.less_than_6", "Less than 6 months") },
    { value: "6_to_12", label: t("scan.step4.exercise_duration_options.6_to_12", "Between 6 and 12 months") },
    { value: "more_than_12", label: t("scan.step4.exercise_duration_options.more_than_12", "More than 12 months") },
  ];

  const WATER_OPTIONS = [
    { value: "less_than_2", label: t("scan.step4.water_intake_options.less_than_2", "Less than 2 liters a day") },
    { value: "about_2", label: t("scan.step4.water_intake_options.about_2", "Around 2 liters a day") },
    { value: "more_than_2", label: t("scan.step4.water_intake_options.more_than_2", "More than 2 liters a day") },
  ];

  const renderSelect = (name, label, options) => (
    <div className="flex flex-col gap-1.5">
      <label className="scan-label">{label} <span className="text-[#2C5BFF] text-sm">*</span></label>
      <select className="scan-select" {...register(name)}>
        <option value="">{t("scan.step4.select", "Select...")}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {errors[name] && <p className="scan-error">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-[22px]">
      {renderSelect("exercise_level", t("scan.step4.exercise_level", "What is your level of physical exercise?"), EXERCISE_LEVEL_OPTIONS)}
      {renderSelect("exercise_duration", t("scan.step4.exercise_duration", "How long have you been exercising?"), EXERCISE_DURATION_OPTIONS)}
      {renderSelect("water_intake", t("scan.step4.water_intake", "How many liters of water do you drink per day?"), WATER_OPTIONS)}
    </div>
  );
}
