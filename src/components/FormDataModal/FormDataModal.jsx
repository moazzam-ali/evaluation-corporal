"use client";

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  Target,
  Eye,
  Sparkles,
  ShieldAlert,
  Heart,
  Clock,
  ShoppingBag,
} from "lucide-react";

const SECTIONS = [
  {
    key: "basic",
    icon: User,
    titleKey: "scan.step1.nav",
    titleFallback: "Basic Info",
    fields: [
      { key: "name", labelKey: "scan.step1.name", fallback: "First Name" },
      { key: "surname", labelKey: "scan.step1.surname", fallback: "Last Name" },
      { key: "email", labelKey: "scan.step1.email", fallback: "Email" },
      { key: "birthDate", labelKey: "scan.step1.birthDate", fallback: "Date of Birth" },
      { key: "phone", labelKey: "scan.step1.phone", fallback: "Phone" },
      { key: "country", labelKey: "scan.step1.country", fallback: "Country" },
      { key: "city", labelKey: "scan.step1.city", fallback: "City" },
    ],
  },
  {
    key: "goal",
    icon: Target,
    titleKey: "scan.step2.nav",
    titleFallback: "Main Goal",
    fields: [
      { key: "skinConcerns", labelKey: "scan.step2.concerns_label", fallback: "Skin Concerns", type: "array" },
      { key: "skinConcernsOther", labelKey: "scan.step2.concerns_other", fallback: "Other Concerns" },
      { key: "priorityConcern", labelKey: "scan.step2.priority_label", fallback: "Priority Concern" },
      { key: "improvementZones", labelKey: "scan.step2.zones_label", fallback: "Improvement Zones", type: "array" },
    ],
  },
  {
    key: "perception",
    icon: Eye,
    titleKey: "scan.step3.nav",
    titleFallback: "Skin Perception",
    fields: [
      { key: "skinType", labelKey: "scan.step3.skin_type_label", fallback: "Skin Type" },
      { key: "skinFeelGeneral", labelKey: "scan.step3.feel_general_label", fallback: "Skin Feel (General)" },
      { key: "skinFeelEndOfDay", labelKey: "scan.step3.feel_end_day_label", fallback: "Skin Feel (End of Day)" },
    ],
  },
  {
    key: "routine",
    icon: Sparkles,
    titleKey: "scan.step4.nav",
    titleFallback: "Current Routine",
    fields: [
      { key: "routineFrequency", labelKey: "scan.step4.frequency_label", fallback: "Routine Frequency" },
      { key: "productsUsed", labelKey: "scan.step4.products_label", fallback: "Products Used", type: "array" },
      { key: "productsUsedOther", labelKey: "scan.step4.products_other", fallback: "Other Products" },
      { key: "essentialProduct", labelKey: "scan.step4.essential_label", fallback: "Essential Product" },
      { key: "missingProduct", labelKey: "scan.step4.missing_label", fallback: "Missing Product" },
      { key: "supplements", labelKey: "scan.step4.supplements_label", fallback: "Supplements" },
    ],
  },
  {
    key: "sensitivity",
    icon: ShieldAlert,
    titleKey: "scan.step5.nav",
    titleFallback: "Sensitivity",
    fields: [
      { key: "reactionLevel", labelKey: "scan.step5.reaction_label", fallback: "Reaction Level" },
      { key: "recentSigns", labelKey: "scan.step5.signs_label", fallback: "Recent Signs", type: "array" },
    ],
  },
  {
    key: "habits",
    icon: Heart,
    titleKey: "scan.step6.nav",
    titleFallback: "Habits",
    fields: [
      { key: "sunscreenUse", labelKey: "scan.step6.sunscreen_label", fallback: "Sunscreen Use" },
      { key: "makeupFrequency", labelKey: "scan.step6.makeup_label", fallback: "Makeup Frequency" },
      { key: "sleepHours", labelKey: "scan.step6.sleep_label", fallback: "Sleep Hours" },
      { key: "stressImpact", labelKey: "scan.step6.stress_label", fallback: "Stress Impact" },
      { key: "waterIntake", labelKey: "scan.step6.water_label", fallback: "Water Intake" },
    ],
  },
  {
    key: "experience",
    icon: Clock,
    titleKey: "scan.step7.nav",
    titleFallback: "Past Experience",
    fields: [
      { key: "treatmentHistory", labelKey: "scan.step7.history_label", fallback: "Treatment History" },
      { key: "frustrations", labelKey: "scan.step7.frustrations_label", fallback: "Frustrations", type: "array" },
    ],
  },
  {
    key: "goals",
    icon: ShoppingBag,
    titleKey: "scan.step8.nav",
    titleFallback: "Goals",
    fields: [
      { key: "lookingFor", labelKey: "scan.step8.looking_for_label", fallback: "Looking For" },
      { key: "wantRoutineRecommendation", labelKey: "scan.step8.recommendation_label", fallback: "Wants Routine Recommendation" },
      { key: "budgetLevel", labelKey: "scan.step8.budget_label", fallback: "Budget Level" },
    ],
  },
];

function formatValue(value) {
  if (value == null || value === "") return null;
  if (Array.isArray(value)) {
    const filtered = value.filter(Boolean);
    if (filtered.length === 0) return null;
    return filtered.map((v) => v.replace(/_/g, " ")).join(", ");
  }
  return String(value).replace(/_/g, " ");
}

export default function FormDataModal({ open, onOpenChange, formData }) {
  const { t } = useTranslation();

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("results.form_data_title", "Your Scan Responses")}</DialogTitle>
          <DialogDescription>
            {t("results.form_data_desc", "All the information you provided during your skin scan.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const filledFields = section.fields.filter(
              (f) => formatValue(formData[f.key]) !== null
            );
            if (filledFields.length === 0) return null;

            return (
              <div key={section.key}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <SectionIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">
                    {t(section.titleKey, section.titleFallback)}
                  </h3>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <dl className="space-y-2">
                    {filledFields.map((field) => {
                      const value = formatValue(formData[field.key]);
                      return (
                        <div key={field.key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                          <dt className="shrink-0 text-xs font-medium text-muted-foreground sm:w-40">
                            {t(field.labelKey, field.fallback)}
                          </dt>
                          <dd className="text-xs capitalize">{value}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
