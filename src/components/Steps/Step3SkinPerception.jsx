"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SKIN_TYPE_OPTIONS = ["dry", "oily", "combination", "sensitive", "dehydrated", "dont_know"];
const FEEL_GENERAL_OPTIONS = ["tight", "shiny", "comfortable", "sensitive_reactive", "dull", "dont_know"];
const FEEL_END_DAY_OPTIONS = ["tight", "shiny", "comfortable", "irritated", "dull"];

function RadioField({ label, value, onChange, options, optionPrefix, t, error }) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2 sm:grid-cols-2">
        {options.map((key) => (
          <label
            key={key}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              value === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value={key} />
            <span className="text-sm">{t(`${optionPrefix}.${key}`, key)}</span>
          </label>
        ))}
      </RadioGroup>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

export default function Step3SkinPerception({ form, t }) {
  const { watch, setValue, formState: { errors } } = form;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step3.title", "How You Perceive Your Skin")}</h2>

      <RadioField
        label={t("scan.step3.skin_type_label", "How would you normally describe your skin?")}
        value={watch("skinType")}
        onChange={(v) => setValue("skinType", v, { shouldValidate: true })}
        options={SKIN_TYPE_OPTIONS}
        optionPrefix="scan.step3.skin_type"
        t={t}
        error={errors.skinType}
      />

      <RadioField
        label={t("scan.step3.feel_general_label", "How does your skin feel most of the time?")}
        value={watch("skinFeelGeneral")}
        onChange={(v) => setValue("skinFeelGeneral", v, { shouldValidate: true })}
        options={FEEL_GENERAL_OPTIONS}
        optionPrefix="scan.step3.feel_general"
        t={t}
        error={errors.skinFeelGeneral}
      />

      <RadioField
        label={t("scan.step3.feel_end_day_label", "How does your skin feel at the end of the day?")}
        value={watch("skinFeelEndOfDay")}
        onChange={(v) => setValue("skinFeelEndOfDay", v, { shouldValidate: true })}
        options={FEEL_END_DAY_OPTIONS}
        optionPrefix="scan.step3.feel_end_day"
        t={t}
        error={errors.skinFeelEndOfDay}
      />
    </div>
  );
}
