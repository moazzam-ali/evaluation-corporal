"use client";

const HISTORY_OPTIONS = ["yes_worked", "yes_no_results", "tried_many_nothing_works", "barely_tried"];
const FRUSTRATION_OPTIONS = ["no_results", "irritation", "dont_know_how_to_combine", "too_expensive", "not_consistent", "other"];

export default function Step7PastExperience({ form, t }) {
  const { watch, setValue, formState: { errors } } = form;
  const treatmentHistory = watch("treatmentHistory");
  const frustrations = watch("frustrations") || [];

  const toggleFrustration = (key) => {
    if (frustrations.includes(key)) {
      setValue("frustrations", frustrations.filter((f) => f !== key), { shouldValidate: true });
    } else {
      setValue("frustrations", [...frustrations, key], { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step7.history_label", "Have you tried any treatment or routine before?")}</label>
        <div className="grid gap-2">
          {HISTORY_OPTIONS.map((key) => (
            <label key={key} className={`scan-radio ${treatmentHistory === key ? "is-checked" : ""}`} onClick={() => setValue("treatmentHistory", key, { shouldValidate: true })}>
              <input type="radio" checked={treatmentHistory === key} onChange={() => setValue("treatmentHistory", key, { shouldValidate: true })} className="sr-only" />
              <span className="scan-radio-dot" />
              <span>{t(`scan.step7.history.${key}`, key)}</span>
            </label>
          ))}
        </div>
        {errors.treatmentHistory && <p className="scan-error">{errors.treatmentHistory.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step7.frustrations_label", "What frustrates you most about the products you've used?")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FRUSTRATION_OPTIONS.map((key) => {
            const checked = frustrations.includes(key);
            return (
              <label key={key} className={`scan-checkbox ${checked ? "is-checked" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleFrustration(key)} className="sr-only" />
                <span className="scan-checkbox-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>{t(`scan.step7.frustrations.${key}`, key)}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
