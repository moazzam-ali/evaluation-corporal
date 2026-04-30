"use client";

const ROUTINE_FREQ_OPTIONS = ["morning_only", "night_only", "morning_and_night", "no_routine"];
const PRODUCT_OPTIONS = [
  "cleanser", "toner", "serum", "day_cream", "sunscreen",
  "eye_contour", "night_cream", "mask", "exfoliant", "other",
];

export default function Step4CurrentRoutine({ form, t }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const routineFrequency = watch("routineFrequency");
  const productsUsed = watch("productsUsed") || [];

  const toggleProduct = (key) => {
    if (productsUsed.includes(key)) {
      setValue("productsUsed", productsUsed.filter((p) => p !== key), { shouldValidate: true });
    } else {
      setValue("productsUsed", [...productsUsed, key], { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step4.frequency_label", "Do you usually have a facial routine?")}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROUTINE_FREQ_OPTIONS.map((key) => (
            <label key={key} className={`scan-radio ${routineFrequency === key ? "is-checked" : ""}`} onClick={() => setValue("routineFrequency", key, { shouldValidate: true })}>
              <input type="radio" checked={routineFrequency === key} onChange={() => setValue("routineFrequency", key, { shouldValidate: true })} className="sr-only" />
              <span className="scan-radio-dot" />
              <span>{t(`scan.step4.frequency.${key}`, key)}</span>
            </label>
          ))}
        </div>
        {errors.routineFrequency && <p className="scan-error">{errors.routineFrequency.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step4.products_label", "What products do you currently use?")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRODUCT_OPTIONS.map((key) => {
            const checked = productsUsed.includes(key);
            return (
              <label key={key} className={`scan-checkbox ${checked ? "is-checked" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleProduct(key)} className="sr-only" />
                <span className="scan-checkbox-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>{t(`scan.step4.products.${key}`, key)}</span>
              </label>
            );
          })}
        </div>
        {productsUsed.includes("other") && (
          <input className="scan-input mt-2" {...register("productsUsedOther")} placeholder={t("scan.step4.products_other_placeholder", "Please specify...")} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step4.essential_label", "What product never misses from your routine?")}</label>
          <input className="scan-input" {...register("essentialProduct")} placeholder={t("scan.step4.essential_placeholder", "e.g., Moisturizer")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="scan-label">{t("scan.step4.missing_label", "What product do you think you're missing?")}</label>
          <input className="scan-input" {...register("missingProduct")} placeholder={t("scan.step4.missing_placeholder", "e.g., Serum")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step4.supplements_label", "Do you take any supplements for your skin?")} <span className="text-[10px] tracking-wider uppercase text-[#6B6B7A] border border-[rgba(26,26,46,0.10)] px-1.5 py-px rounded-full">{t("common.optional", "Optional")}</span></label>
        <input className="scan-input" {...register("supplements")} placeholder={t("scan.step4.supplements_placeholder", "e.g., Collagen, Vitamin C")} />
      </div>
    </div>
  );
}
