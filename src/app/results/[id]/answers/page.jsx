"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import useAnalysisStore from "@/store/analysisStore";
import Loader from "@/components/Loader/Loader";
import { Card, CardHeader } from "@/components/results/ResultsCharts";

/* Read-only view of the intake form exactly as the user submitted it.
   Question and option labels reuse the scan.* dictionary, so the screen
   follows the UI language while the stored values stay raw enums. */
export default function FormAnswersPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { fetchAnalysis, isLoading, error, formData, analysisData } = useAnalysisStore();

  useEffect(() => {
    const hasData = !!useAnalysisStore.getState().formData;
    if (!hasData && id) fetchAnalysis(id);
  }, [id, fetchAnalysis]);

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p style={{ fontSize: "18px", color: "#9C5A4A", marginBottom: "16px" }}>{t("common.error")}</p>
        <p style={{ fontSize: "14px", color: "#6B5B4B", marginBottom: "24px" }}>{error}</p>
        <Link href={`/results/${id}`} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500,
          padding: "11px 20px", borderRadius: "999px",
          border: "1.5px solid rgba(47,47,43,0.16)", background: "transparent", color: "#2F2F2B",
        }}>
          {t("answers.back", "Back to results")}
        </Link>
      </div>
    );
  }

  if (!formData) return <Loader />;

  const fd = formData;
  const opt = (step, field, v) =>
    v ? t(`scan.${step}.${field}_options.${v}`, String(v).replace(/_/g, " ")) : null;
  const yn = (v) =>
    v === "yes" ? t("scan.step3.yes", "Yes") : v === "no" ? t("scan.step3.no", "No") : null;
  const num = (v, unit) => (v || v === 0 ? `${v} ${unit}` : null);

  const sections = [
    {
      key: "step1",
      title: t("scan.step1.nav", "Personal Info"),
      rows: [
        [t("scan.step1.name", "Name"), fd.name],
        [t("scan.step1.surname", "Surname"), fd.surname],
        [t("scan.step1.email", "Email"), fd.email],
        [t("scan.step1.birth_date", "Date of birth"), fd.birthDate],
        [t("scan.step1.phone", "Phone number"), fd.phone],
        [t("scan.step1.country", "Country"), fd.country],
        [t("scan.step1.province", "State/Province"), fd.province],
        [t("scan.step1.city", "City"), fd.city],
      ],
    },
    {
      key: "step2",
      title: t("scan.step2.nav", "Physical Info"),
      rows: [
        [t("scan.step2.sex", "Sex"), opt("step2", "sex", fd.sex)],
        [t("scan.step2.weight", "Weight (kg)"), num(fd.weight, t("rd.unit_kg", "kg"))],
        [t("scan.step2.height", "Height (cm)"), num(fd.height, t("rd.unit_cm", "cm"))],
        [t("scan.step2.waist", "Waist measurement (cm)"), num(fd.waist, t("rd.unit_cm", "cm"))],
        [t("scan.step2.hip", "Hip measurement (cm)"), num(fd.hip, t("rd.unit_cm", "cm"))],
      ],
    },
    {
      key: "step3",
      title: t("scan.step3.nav", "Diet & Nutrition"),
      rows: [
        [t("scan.step3.diet_type", "What kind of diet do you follow?"), opt("step3", "diet_type", fd.diet_type)],
        [t("scan.step3.meals_per_day", "How many meals a day do you eat?"), opt("step3", "meals_per_day", fd.meals_per_day)],
        [t("scan.step3.has_breakfast", "Do you usually have breakfast?"), yn(fd.has_breakfast)],
        [t("scan.step3.breakfast_description", "What kind of breakfast do you usually have?"), fd.breakfast_description],
      ],
    },
    {
      key: "step4",
      title: t("scan.step4.nav", "Activity"),
      rows: [
        [t("scan.step4.exercise_level", "What is your level of physical exercise?"), opt("step4", "exercise_level", fd.exercise_level)],
        [t("scan.step4.exercise_duration", "How long have you been exercising?"), opt("step4", "exercise_duration", fd.exercise_duration)],
        [t("scan.step4.water_intake", "How many liters of water do you drink per day?"), opt("step4", "water_intake", fd.water_intake)],
      ],
    },
    {
      key: "step5",
      title: t("scan.step5.nav", "Health"),
      question: t("scan.step5.health_conditions", "Select one or more of the following conditions:"),
      chips: (Array.isArray(fd.health_conditions) ? fd.health_conditions : [])
        .map((c) => t(`scan.step5.health_conditions_options.${c}`, String(c).replace(/_/g, " "))),
    },
    {
      key: "step6",
      title: t("scan.step6.nav", "Goals"),
      rows: [
        [t("scan.step6.goal", "What goal would you like to achieve?"), opt("step6", "goal", fd.goal)],
        [t("scan.step6.weight_at_ideal_age", "Realistically, at what weight would you feel good?"), num(fd.weight_at_ideal_age, t("rd.unit_kg", "kg"))],
        [t("scan.step6.has_skincare_routine", "Do you follow a daily wellness or self-care routine?"), yn(fd.has_skincare_routine)],
        [t("scan.step6.skincare_products", "What kind of products do you use?"), fd.skincare_products],
        [t("scan.step6.want_facial_evaluation", "Would you like a free wellness consultation?"), yn(fd.want_facial_evaluation)],
      ],
    },
  ].map((s) => ({ ...s, rows: (s.rows || []).filter(([, v]) => v != null && v !== "") }))
    .filter((s) => s.rows.length > 0 || (s.chips && s.chips.length > 0));

  const submittedDate = analysisData?.createdAt
    ? new Date(analysisData.createdAt).toLocaleDateString(i18n.language || "en", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#F4EFE7", fontFamily: "var(--font-inter)" }}>
      {/* Header — mirrors the visual guide screen */}
      <section className="relative" style={{ padding: "28px 20px 8px" }}>
        <div className="max-w-[860px] mx-auto">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors hover:text-[var(--ink)]"
            style={{ color: "var(--muted-fg)", fontFamily: "var(--font-inter)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {t("answers.back", "Back to results")}
          </button>

          <div className="text-center mt-8 max-w-[720px] mx-auto">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--primary-hex, #9B8573)" }}>
              {t("answers.eyebrow", "Your submission")}
            </div>
            <h1 className="mt-3 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, color: "var(--ink)" }}>
              {t("answers.title", "Everything you told us.")}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {t("answers.subtitle", "The intake answers behind this assessment, exactly as you submitted them.")}
              {submittedDate ? ` ${t("answers.submitted", "Submitted {{date}}.", { date: submittedDate })}` : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Answer sections */}
      <section className="pb-24 pt-10">
        <div className="max-w-[860px] mx-auto px-4 sm:px-8 flex flex-col gap-4">
          {sections.length === 0 ? (
            <div className="text-center py-20 text-[14px]" style={{ color: "var(--muted-fg)" }}>
              {t("answers.empty", "No form answers are stored for this assessment.")}
            </div>
          ) : (
            sections.map((s) => (
              <Card key={s.key}>
                <CardHeader title={s.title} />
                {s.rows?.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
                    {s.rows.map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--muted-fg)" }}>{label}</div>
                        <div className="text-[14.5px] leading-relaxed mt-1.5 break-words" style={{ color: "var(--ink)" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {s.chips && (
                  <div>
                    {s.question && (
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2.5" style={{ color: "var(--muted-fg)" }}>{s.question}</div>
                    )}
                    {s.chips.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {s.chips.map((c) => (
                          <span key={c} className="text-[12.5px] font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(47,47,43,0.05)", color: "var(--ink)", border: "1px solid var(--border-hex, #E4D9C6)" }}>{c}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[14px]" style={{ color: "var(--muted-fg)" }}>{t("answers.none_selected", "None selected.")}</p>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
