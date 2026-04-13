"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const LOOKING_FOR_OPTIONS = ["basic_routine", "complete_routine", "specific_problem", "prevention", "personalized_advice"];
const WANT_RECOMMENDATION_OPTIONS = ["yes", "no"];
const BUDGET_OPTIONS = ["basic", "medium", "premium"];

export default function Step8GoalsCommercial({ form, t }) {
  const { watch, setValue, formState: { errors } } = form;

  const fields = [
    { name: "lookingFor", label: t("scan.step8.looking_for_label", "What are you looking for right now?"), options: LOOKING_FOR_OPTIONS, prefix: "scan.step8.looking_for" },
    { name: "wantRoutineRecommendation", label: t("scan.step8.recommendation_label", "Would you like us to recommend a routine tailored to your skin and goal?"), options: WANT_RECOMMENDATION_OPTIONS, prefix: "scan.step8.recommendation" },
    { name: "budgetLevel", label: t("scan.step8.budget_label", "What level of investment is comfortable for you to care for your skin each month?"), options: BUDGET_OPTIONS, prefix: "scan.step8.budget" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step8.title", "Your Goals")}</h2>

      {fields.map(({ name, label, options, prefix }) => (
        <div key={name} className="space-y-3">
          <Label>{label}</Label>
          <RadioGroup
            value={watch(name)}
            onValueChange={(v) => setValue(name, v, { shouldValidate: true })}
            className="grid gap-2"
          >
            {options.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  watch(name) === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={key} />
                <span className="text-sm">{t(`${prefix}.${key}`, key)}</span>
              </label>
            ))}
          </RadioGroup>
          {errors[name] && <p className="text-xs text-destructive">{errors[name].message}</p>}
        </div>
      ))}
    </div>
  );
}
