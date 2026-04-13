"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step2.title", "Main Goal")}</h2>

      {/* Concerns — max 3 */}
      <div className="space-y-3">
        <Label>{t("scan.step2.concerns_label", "What concerns you most about your skin right now? (up to 3)")}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONCERN_OPTIONS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                skinConcerns.includes(key) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              } ${skinConcerns.length >= 3 && !skinConcerns.includes(key) ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Checkbox
                checked={skinConcerns.includes(key)}
                onCheckedChange={() => toggleConcern(key)}
                disabled={skinConcerns.length >= 3 && !skinConcerns.includes(key)}
              />
              <span className="text-sm">{t(`scan.step2.concerns.${key}`, key)}</span>
            </label>
          ))}
        </div>
        {errors.skinConcerns && <p className="text-xs text-destructive">{errors.skinConcerns.message}</p>}

        {/* "Other" text field — shown when "other" is selected */}
        {skinConcerns.includes("other") && (
          <Input
            {...register("skinConcernsOther")}
            placeholder={t("scan.step2.concerns_other_placeholder", "Please describe...")}
            className="mt-2"
          />
        )}
      </div>

      {/* Priority concern */}
      <div className="space-y-2">
        <Label>{t("scan.step2.priority_label", "If you could improve just one thing about your skin, what would it be?")}</Label>
        <Input {...register("priorityConcern")} placeholder={t("scan.step2.priority_placeholder", "Describe your top priority...")} />
        {errors.priorityConcern && <p className="text-xs text-destructive">{errors.priorityConcern.message}</p>}
      </div>

      {/* Improvement zones */}
      <div className="space-y-3">
        <Label>{t("scan.step2.zones_label", "Where would you like to see the most change?")}</Label>
        <div className="flex flex-wrap gap-2">
          {ZONE_OPTIONS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 cursor-pointer text-sm transition-colors ${
                improvementZones.includes(key) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={improvementZones.includes(key)}
                onCheckedChange={() => toggleZone(key)}
                className="h-3.5 w-3.5"
              />
              {t(`scan.step2.zones.${key}`, key)}
            </label>
          ))}
        </div>
        {errors.improvementZones && <p className="text-xs text-destructive">{errors.improvementZones.message}</p>}
      </div>
    </div>
  );
}
