"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step6.title", "Habits That Affect Your Skin")}</h2>

      {FIELDS.map(({ name, options }) => (
        <div key={name} className="space-y-3">
          <Label>{t(`scan.step6.${name}_label`)}</Label>
          <RadioGroup
            value={watch(name)}
            onValueChange={(v) => setValue(name, v, { shouldValidate: true })}
            className="grid gap-2 sm:grid-cols-2"
          >
            {options.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  watch(name) === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={key} />
                <span className="text-sm">{t(`scan.step6.${name}.${key}`, key)}</span>
              </label>
            ))}
          </RadioGroup>
          {errors[name] && <p className="text-xs text-destructive">{errors[name].message}</p>}
        </div>
      ))}
    </div>
  );
}
