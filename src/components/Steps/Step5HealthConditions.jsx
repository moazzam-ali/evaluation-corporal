"use client";

export default function Step5HealthConditions({ form, t }) {
  const { watch, setValue } = form;
  const health_conditions = watch("health_conditions") || [];

  const toggleCondition = (val) => {
    const current = health_conditions || [];
    if (current.includes(val)) {
      setValue("health_conditions", current.filter((v) => v !== val), { shouldValidate: true });
    } else {
      setValue("health_conditions", [...current, val], { shouldValidate: true });
    }
  };

  const CONDITION_OPTIONS = [
    "low_bone_density", "constipation", "athlete_supplements", "high_cholesterol",
    "few_vegetables", "low_energy", "trouble_sleeping", "poor_mental_agility",
    "inflammation", "skin_cellulite", "little_water", "demanding_job",
    "belly_fat", "circulation_problems",
  ];

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-3">
        <label className="scan-label">{t("scan.step5.health_conditions", "Select one or more of the following conditions:")}</label>
        <div className="flex flex-col gap-2">
          {CONDITION_OPTIONS.map((cond) => (
            <button
              key={cond}
              type="button"
              className={`scan-checkbox ${health_conditions.includes(cond) ? "is-checked" : ""}`}
              onClick={() => toggleCondition(cond)}
            >
              <span className="scan-checkbox-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {t(`scan.step5.health_conditions_options.${cond}`, cond.replace(/_/g, " "))}
            </button>
          ))}
        </div>
      </div>

      {health_conditions.length > 0 && (
        <div className="rounded-xl border border-[rgba(155,133,115,0.2)] bg-[#EFE7DC] px-4 py-3">
          <p className="text-[12.5px] leading-relaxed text-[#6B5B4B]" style={{ fontFamily: "var(--font-inter)" }}>
            {t("scan.step5.selected_count", "{{count}} condition(s) selected", { count: health_conditions.length })}
          </p>
        </div>
      )}
    </div>
  );
}
