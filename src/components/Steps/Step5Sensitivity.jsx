"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("scan.step5.title", "Sensitivity & Tolerance")}</h2>

      <div className="space-y-3">
        <Label>{t("scan.step5.reaction_label", "Does your skin react easily to some products?")}</Label>
        <RadioGroup value={reactionLevel} onValueChange={(v) => setValue("reactionLevel", v, { shouldValidate: true })} className="grid gap-2 sm:grid-cols-2">
          {REACTION_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${reactionLevel === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <RadioGroupItem value={key} />
              <span className="text-sm">{t(`scan.step5.reaction.${key}`, key)}</span>
            </label>
          ))}
        </RadioGroup>
        {errors.reactionLevel && <p className="text-xs text-destructive">{errors.reactionLevel.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>{t("scan.step5.signs_label", "Have you noticed any of these signs lately?")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {SIGN_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${recentSigns.includes(key) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <Checkbox checked={recentSigns.includes(key)} onCheckedChange={() => toggleSign(key)} />
              <span className="text-sm">{t(`scan.step5.signs.${key}`, key)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
