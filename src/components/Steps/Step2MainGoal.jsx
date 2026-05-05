"use client";

const CONCERN_OPTIONS = [
  "dryness", "wrinkles", "sagging", "dark_spots", "dullness",
  "blemishes", "pores", "eye_area", "sensitivity", "other",
];
const ZONE_OPTIONS = ["full_face", "eye_contour", "neck", "hands", "body"];

export default function Step2MainGoal({ form, t }) {
  const { watch, setValue, register, formState: { errors } } = form;
  const skinConcerns = watch("skinConcerns") || [];
  const improvementZones = watch("improvementZones") || [];

  const toggleConcern = (key) => {
    if (skinConcerns.includes(key)) {
      setValue("skinConcerns", skinConcerns.filter((c) => c !== key), { shouldValidate: true });
    } else if (skinConcerns.length < 3) {
      setValue("skinConcerns", [...skinConcerns, key], { shouldValidate: true });
    }
  };

  const toggleZone = (key) => {
    if (improvementZones.includes(key)) {
      setValue("improvementZones", improvementZones.filter((z) => z !== key), { shouldValidate: true });
    } else {
      setValue("improvementZones", [...improvementZones, key], { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between mb-1">
          <label className="scan-label">{t("scan.step2.concerns_label", "What concerns you most about your skin right now?")}</label>
          <span className="scan-counter">{skinConcerns.length} of 3</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONCERN_OPTIONS.map((key) => {
            const checked = skinConcerns.includes(key);
            const disabled = skinConcerns.length >= 3 && !checked;
            return (
              <label key={key} className={`scan-checkbox ${checked ? "is-checked" : ""} ${disabled ? "is-disabled" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleConcern(key)} disabled={disabled} className="sr-only" />
                <span className="scan-checkbox-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span>{t(`scan.step2.concerns.${key}`, key)}</span>
              </label>
            );
          })}
        </div>
        {errors.skinConcerns && <p className="scan-error">{errors.skinConcerns.message}</p>}
        {skinConcerns.includes("other") && (
          <input className="scan-input mt-2" {...register("skinConcernsOther")} placeholder={t("scan.step2.concerns_other_placeholder", "Please describe...")} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step2.priority_label", "If you could improve just one thing about your skin, what would it be?")}</label>
        <textarea className="scan-textarea" placeholder={t("scan.step2.priority_placeholder", "Describe your top priority...")} {...register("priorityConcern")} />
        {errors.priorityConcern && <p className="scan-error">{errors.priorityConcern.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="scan-label">{t("scan.step2.zones_label", "Where would you like to see the most change?")}</label>
        <div className="flex flex-wrap gap-2">
          {ZONE_OPTIONS.map((key) => {
            const checked = improvementZones.includes(key);
            return (
              <label key={key} className={`scan-chip ${checked ? "is-checked" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleZone(key)} className="sr-only" />
                <span className="scan-chip-tick">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {t(`scan.step2.zones.${key}`, key)}
              </label>
            );
          })}
        </div>
        {errors.improvementZones && <p className="scan-error">{errors.improvementZones.message}</p>}
      </div>
    </div>
  );
}
