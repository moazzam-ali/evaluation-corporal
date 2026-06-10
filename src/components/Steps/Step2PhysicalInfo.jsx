"use client";

export default function Step2PhysicalInfo({ form, t }) {
  const { register, formState: { errors }, watch, setValue } = form;
  const sex = watch("sex");

  const SEX_OPTIONS = [
    { value: "male", label: t("scan.step2.sex_options.male", "Masculine") },
    { value: "female", label: t("scan.step2.sex_options.female", "Feminine") },
  ];

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Sex selection */}
      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step2.sex", "Sex")} <span className="text-[#9B8573] text-sm">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          {SEX_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`scan-radio ${sex === opt.value ? "is-checked" : ""}`}
              onClick={() => setValue("sex", opt.value, { shouldValidate: true })}
            >
              <span className="scan-radio-dot" />
              {opt.label}
              <input type="radio" className="sr-only" value={opt.value} {...register("sex")} />
            </label>
          ))}
        </div>
        {errors.sex && <p className="scan-error">{t("validation.physical.sex_required", errors.sex.message)}</p>}
      </div>

      {/* Weight & Height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step2.weight", "Weight (kg)")} <span className="text-[#9B8573] text-sm">*</span></label>
          <input className="scan-input" type="number" step="0.1" placeholder={t("scan.step2.weight_placeholder", "Enter your weight")} {...register("weight")} />
          {errors.weight && <p className="scan-error">{errors.weight.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step2.height", "Height (cm)")} <span className="text-[#9B8573] text-sm">*</span></label>
          <input className="scan-input" type="number" step="0.1" placeholder={t("scan.step2.height_placeholder", "Enter your height")} {...register("height")} />
          {errors.height && <p className="scan-error">{errors.height.message}</p>}
        </div>
      </div>

      {/* Measurement intro */}
      <div className="rounded-xl border border-[rgba(47,47,43,0.10)] bg-[#F8F6F2] p-4">
        <p className="text-[13px] leading-relaxed text-[#6B5B4B]" style={{ fontFamily: "var(--font-inter)" }}>
          {t("scan.step2.measurement_intro", "Do you know your waist and hip measurements? Would you like me to measure them for you? It will only take a moment. (A measuring tape is recommended.)")}
        </p>
      </div>

      {/* Waist & Hip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step2.waist", "Waist measurement (cm)")} <span className="text-[#9B8573] text-sm">*</span></label>
          <input className="scan-input" type="number" step="0.1" placeholder={t("scan.step2.waist_placeholder", "Enter your waist measurement")} {...register("waist")} />
          <span className="scan-help">{t("scan.step2.waist_help", "Used to calculate your waist-to-hip ratio.")}</span>
          {errors.waist && <p className="scan-error">{errors.waist.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step2.hip", "Hip measurement (cm)")} <span className="text-[#9B8573] text-sm">*</span></label>
          <input className="scan-input" type="number" step="0.1" placeholder={t("scan.step2.hip_placeholder", "Enter your hip measurement")} {...register("hip")} />
          <span className="scan-help">{t("scan.step2.hip_help", "Used to calculate your waist-to-hip ratio.")}</span>
          {errors.hip && <p className="scan-error">{errors.hip.message}</p>}
        </div>
      </div>
    </div>
  );
}
