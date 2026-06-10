"use client";

export default function Step6GoalsCare({ form, t }) {
  const { register, formState: { errors }, watch, setValue } = form;
  const has_skincare_routine = watch("has_skincare_routine");

  const GOAL_OPTIONS = [
    { value: "weight_control", label: t("scan.step6.goal_options.weight_control", "Control my weight and reduce body fat") },
    { value: "maintain_care", label: t("scan.step6.goal_options.maintain_care", "Maintain my weight, take better care of myself") },
    { value: "gain_weight", label: t("scan.step6.goal_options.gain_weight", "Increase weight and/or muscle mass") },
  ];

  const YES_NO = [
    { value: "yes", label: t("scan.step6.yes", "Yes") },
    { value: "no", label: t("scan.step6.no", "No") },
  ];

  const renderRadioGroup = (name, label, options) => (
    <div className="flex flex-col gap-2">
      <label className="scan-label">{label} <span className="text-[#9B8573] text-sm">*</span></label>
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
      {/* Goal */}
      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step6.goal", "What goal would you like to achieve?")} <span className="text-[#9B8573] text-sm">*</span></label>
        <select className="scan-select" {...register("goal")}>
          <option value="">{t("scan.step6.select", "Select...")}</option>
          {GOAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.goal && <p className="scan-error">{errors.goal.message}</p>}
      </div>

      {/* Ideal weight */}
      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step6.weight_at_ideal_age", "Realistically, at what weight would you feel good?")} <span className="text-[#9B8573] text-sm">*</span></label>
        <input className="scan-input" type="number" step="0.1" placeholder={t("scan.step6.weight_at_ideal_age_placeholder", "Enter the weight (kg)")} {...register("weight_at_ideal_age")} />
        {errors.weight_at_ideal_age && <p className="scan-error">{errors.weight_at_ideal_age.message}</p>}
      </div>

      {/* Skincare routine */}
      {renderRadioGroup("has_skincare_routine", t("scan.step6.has_skincare_routine", "Do you have a daily skincare, body, or hair care routine?"), YES_NO)}

      {has_skincare_routine === "yes" && (
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step6.skincare_products", "What kind of products do you use?")}</label>
          <textarea className="scan-textarea" placeholder={t("scan.step6.skincare_products_placeholder", "Briefly describe your products.")} {...register("skincare_products")} />
        </div>
      )}

      {/* Facial evaluation */}
      {renderRadioGroup("want_facial_evaluation", t("scan.step6.want_facial_evaluation", "Would you like a free facial assessment?"), YES_NO)}

      {/* Privacy policy */}
      <div className="flex items-start gap-3 rounded-xl border border-[rgba(47,47,43,0.10)] bg-[#F8F6F2] p-4">
        <input
          type="checkbox"
          id="privacy_policy"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#9B8573] cursor-pointer"
          {...register("privacy_policy")}
        />
        <label htmlFor="privacy_policy" className="text-[12.5px] leading-relaxed text-[#4A4A42] cursor-pointer" style={{ fontFamily: "var(--font-inter)" }}>
          {t("scan.step6.privacy_policy", "I accept the Privacy Policy")}
          {" "}
          <a href="/privacy" target="_blank" className="text-[#9B8573] underline underline-offset-2 hover:text-[#6B5B4B]">
            {t("scan.step6.privacy_policy_link", "Read our Privacy Policy")}
          </a>
          {" "}
          <span className="text-[#9B8573]">*</span>
        </label>
      </div>
      {errors.privacy_policy && <p className="scan-error">{errors.privacy_policy.message}</p>}

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-[#6B5B4B]" style={{ fontFamily: "var(--font-inter)" }}>
        {t("scan.step6.disclaimer", "This self-assessment is not intended for diagnostic or therapeutic purposes. It is for informational purposes only and does not replace in any case the evaluation of a healthcare professional.")}
      </p>
    </div>
  );
}
