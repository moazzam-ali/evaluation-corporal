"use client";

const REACTION_OPTIONS = ["yes_a_lot", "sometimes", "no", "dont_know"];
const SIGN_OPTIONS = ["redness", "itching", "flaking", "excess_shine", "blemishes", "dark_spots", "tightness", "none"];

export default function Step5Sensitivity({ form, t }) {
  const { watch, setValue, formState: { errors } } = form;
  const reactionLevel = watch("reactionLevel");
  const recentSigns = watch("recentSigns") || [];

  const toggleSign = (key) => {
    if (key === "none") {
      setValue("recentSigns", recentSigns.includes("none") ? [] : ["none"], { shouldValidate: true });
      return;
    }
    const without = recentSigns.filter((s) => s !== "none");
    if (without.includes(key)) {
      setValue("recentSigns", without.filter((s) => s !== key), { shouldValidate: true });
    } else {
      setValue("recentSigns", [...without, key], { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step5.reaction_label", "Does your skin react easily to some products?")}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {REACTION_OPTIONS.map((key) => (
            <label key={key} className={`scan-radio ${reactionLevel === key ? "is-checked" : ""}`} onClick={() => setValue("reactionLevel", key, { shouldValidate: true })}>
              <input type="radio" checked={reactionLevel === key} onChange={() => setValue("reactionLevel", key, { shouldValidate: true })} className="sr-only" />
              <span className="scan-radio-dot" />
              <span>{t(`scan.step5.reaction.${key}`, key)}</span>
            </label>
          ))}
        </div>
        {errors.reactionLevel && <p className="scan-error">{errors.reactionLevel.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="scan-label">{t("scan.step5.signs_label", "Have you noticed any of these signs lately?")}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SIGN_OPTIONS.map((key) => {
            const checked = recentSigns.includes(key);
            return (
              <label key={key} className={`scan-checkbox ${checked ? "is-checked" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleSign(key)} className="sr-only" />
                <span className="scan-checkbox-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>{t(`scan.step5.signs.${key}`, key)}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
