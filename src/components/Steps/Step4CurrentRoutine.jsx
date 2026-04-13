"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ROUTINE_FREQ_OPTIONS = ["morning_only", "night_only", "morning_and_night", "no_routine"];
const PRODUCT_OPTIONS = [
  "cleanser", "toner", "serum", "day_cream", "sunscreen",
  "eye_contour", "night_cream", "mask", "exfoliant", "other",
];
const RETINOID_OPTIONS = ["yes", "no", "dont_know"];

export default function Step4CurrentRoutine({ form, t }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const routineFrequency = watch("routineFrequency");
  const productsUsed = watch("productsUsed") || [];

  const toggleProduct = (key) => {
    if (productsUsed.includes(key)) {
      setValue("productsUsed", productsUsed.filter((p) => p !== key), { shouldValidate: true });
    } else {
      setValue("productsUsed", [...productsUsed, key], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step4.title", "Current Routine")}</h2>

      {/* Routine frequency */}
      <div className="space-y-3">
        <Label>{t("scan.step4.frequency_label", "Do you usually have a facial routine?")}</Label>
        <RadioGroup value={routineFrequency} onValueChange={(v) => setValue("routineFrequency", v, { shouldValidate: true })} className="grid gap-2 sm:grid-cols-2">
          {ROUTINE_FREQ_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${routineFrequency === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <RadioGroupItem value={key} />
              <span className="text-sm">{t(`scan.step4.frequency.${key}`, key)}</span>
            </label>
          ))}
        </RadioGroup>
        {errors.routineFrequency && <p className="text-xs text-destructive">{errors.routineFrequency.message}</p>}
      </div>

      {/* Products used */}
      <div className="space-y-3">
        <Label>{t("scan.step4.products_label", "What products do you currently use?")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRODUCT_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${productsUsed.includes(key) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <Checkbox checked={productsUsed.includes(key)} onCheckedChange={() => toggleProduct(key)} />
              <span className="text-sm">{t(`scan.step4.products.${key}`, key)}</span>
            </label>
          ))}
        </div>

        {/* "Other" text field — shown when "other" is selected */}
        {productsUsed.includes("other") && (
          <Input
            {...register("productsUsedOther")}
            placeholder={t("scan.step4.products_other_placeholder", "Please specify...")}
            className="mt-2"
          />
        )}
      </div>

      {/* Essential product */}
      <div className="space-y-2">
        <Label>{t("scan.step4.essential_label", "What product never misses from your routine?")}</Label>
        <Input {...register("essentialProduct")} placeholder={t("scan.step4.essential_placeholder", "e.g., Moisturizer")} />
      </div>

      {/* Missing product */}
      <div className="space-y-2">
        <Label>{t("scan.step4.missing_label", "What product do you think you're missing or don't know which to use?")}</Label>
        <Input {...register("missingProduct")} placeholder={t("scan.step4.missing_placeholder", "e.g., Serum")} />
      </div>

      {/* Supplements */}
      <div className="space-y-2">
        <Label>{t("scan.step4.supplements_label", "Do you take any supplements for your skin? (e.g., collagen)")}</Label>
        <Input {...register("supplements")} placeholder={t("scan.step4.supplements_placeholder", "e.g., Collagen, Vitamin C")} />
      </div>

      {/* Retinoid preference */}
      <div className="space-y-3">
        <Label>{t("scan.step4.retinoid_label", "Do you prefer to avoid products with vitamin A or retinoids?")}</Label>
        <RadioGroup value={watch("retinoidPreference")} onValueChange={(v) => setValue("retinoidPreference", v, { shouldValidate: true })} className="flex gap-3">
          {RETINOID_OPTIONS.map((key) => (
            <label key={key} className={`flex items-center gap-2 rounded-full border px-4 py-2 cursor-pointer text-sm transition-colors ${watch("retinoidPreference") === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <RadioGroupItem value={key} />
              {t(`scan.step4.retinoid.${key}`, key)}
            </label>
          ))}
        </RadioGroup>
        {errors.retinoidPreference && <p className="text-xs text-destructive">{errors.retinoidPreference.message}</p>}
      </div>
    </div>
  );
}
