"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step7.title", "Past Experience")}</h2>

      <div className="space-y-3">
        <Label>{t("scan.step7.history_label", "Have you tried any treatment or routine to improve your skin before?")}</Label>
        <RadioGroup value={treatmentHistory} onValueChange={(v) => setValue("treatmentHistory", v, { shouldValidate: true })} className="grid gap-2">
          {HISTORY_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${treatmentHistory === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <RadioGroupItem value={key} />
              <span className="text-sm">{t(`scan.step7.history.${key}`, key)}</span>
            </label>
          ))}
        </RadioGroup>
        {errors.treatmentHistory && <p className="text-xs text-destructive">{errors.treatmentHistory.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>{t("scan.step7.frustrations_label", "What frustrates you most about the products you've used?")}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FRUSTRATION_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${frustrations.includes(key) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <Checkbox checked={frustrations.includes(key)} onCheckedChange={() => toggleFrustration(key)} />
              <span className="text-sm">{t(`scan.step7.frustrations.${key}`, key)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
