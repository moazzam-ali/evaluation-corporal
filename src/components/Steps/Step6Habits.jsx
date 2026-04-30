"use client";

const FIELDS = [
  { name: "sunscreenUse", options: ["daily", "sometimes", "summer_only", "no"] },
  { name: "makeupFrequency", options: ["daily", "several_times_week", "occasionally", "never"] },
  { name: "sleepHours", options: ["less_than_5", "5_6", "7_8", "more_than_8"] },
  { name: "stressImpact", options: ["yes", "a_little", "no"] },
  { name: "waterIntake", options: ["yes", "sometimes", "no"] },
];

export default function Step6Habits({ form, t }) {
  const { watch, setValue, formState: { errors } } = form;

  return (
    <div className="flex flex-col gap-[22px]">
      {FIELDS.map(({ name, options }) => (
        <div key={name} className="flex flex-col gap-2">
          <label className="scan-label">{t(`scan.step6.${name}_label`)}</label>
          <div className={`grid gap-2 ${options.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {options.map((key) => (
              <label key={key} className={`scan-radio ${watch(name) === key ? "is-checked" : ""}`} onClick={() => setValue(name, key, { shouldValidate: true })}>
                <input type="radio" checked={watch(name) === key} onChange={() => setValue(name, key, { shouldValidate: true })} className="sr-only" />
                <span className="scan-radio-dot" />
                <span>{t(`scan.step6.${name}.${key}`, key)}</span>
              </label>
            ))}
          </div>
          {errors[name] && <p className="scan-error">{errors[name].message}</p>}
        </div>
      ))}
    </div>
  );
}
