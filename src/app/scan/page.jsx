"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Check } from "lucide-react";

import AnimatedLogo from "@/components/AnimatedLogo/AnimatedLogo";
import { fullScanSchema, STEP_FIELD_NAMES, DEFAULT_VALUES } from "@/lib/schemas/scan-schemas";

import Step1PersonalInfo from "@/components/Steps/Step1PersonalInfo";
import Step2PhysicalInfo from "@/components/Steps/Step2PhysicalInfo";
import Step3DietNutrition from "@/components/Steps/Step3DietNutrition";
import Step4ActivityHydration from "@/components/Steps/Step4ActivityHydration";
import Step5HealthConditions from "@/components/Steps/Step5HealthConditions";
import Step6GoalsCare from "@/components/Steps/Step6GoalsCare";
import Step7FinalSubmission from "@/components/Steps/Step7FinalSubmission";

const STEP_COMPONENTS = [
  Step1PersonalInfo, Step2PhysicalInfo, Step3DietNutrition,
  Step4ActivityHydration, Step5HealthConditions, Step6GoalsCare,
  Step7FinalSubmission,
];

const TOTAL_STEPS = STEP_COMPONENTS.length;

const STEP_META = [
  { key: "step1", label: "Personal Info", title: "Personal", titleEm: "information", sub: "Tell us about yourself — we use this to tailor your report and reach you with results." },
  { key: "step2", label: "Physical Info", title: "Physical", titleEm: "information", sub: "Your body measurements help us calculate your health metrics accurately." },
  { key: "step3", label: "Diet & Nutrition", title: "Diet &", titleEm: "nutrition", sub: "What you eat shapes everything — we start here." },
  { key: "step4", label: "Activity", title: "Activity &", titleEm: "hydration", sub: "How you move and how much you drink — two big levers." },
  { key: "step5", label: "Health", title: "Health", titleEm: "conditions", sub: "Select anything that applies — we use this to tailor product recommendations." },
  { key: "step6", label: "Goals", title: "Goals &", titleEm: "care", sub: "What you're aiming for, and what you're already doing." },
  { key: "step7", label: "Review", title: "Ready to", titleEm: "send?", sub: "Review your information and make sure everything is correct." },
];

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <AnimatedLogo size={100} />
      </div>
    }>
      <ScanPageInner />
    </Suspense>
  );
}

function ScanPageInner() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitComplete, setSubmitComplete] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeAnalysisStep, setActiveAnalysisStep] = useState(0);
  const progressRef = useRef(null);

  const cleanID = (s) => { const n = Number(s); return s && !isNaN(n) ? String(Math.trunc(n)) : s; };
  const chatIDs = searchParams.get("n")?.split(",").map((s) => cleanID(s.trim())).filter(Boolean) || [];
  const botIndex = cleanID(searchParams.get("b") || "1");
  const accountIDs = searchParams.get("a")?.split(",").map((s) => cleanID(s.trim())).filter(Boolean) || [];
  const contactIDs = searchParams.get("c")?.split(",").map((s) => cleanID(s.trim())).filter(Boolean) || [];
  const lang = searchParams.get("l") || i18n.language || "en";

  const hasRequiredParams = chatIDs.length > 0 && accountIDs.length > 0 && contactIDs.length > 0;

  if (!hasRequiredParams) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div
          className="mx-auto w-full max-w-md rounded-3xl border border-[rgba(47,47,43,0.10)] bg-white p-8 shadow-sm"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFE7DC]">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#9B8573" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2
            className="mb-2 text-[28px] text-[#2F2F2B]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, lineHeight: 1.2 }}
          >
            {t("scan.access_title", "Access required")}
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#6B5B4B]">
            {t("scan.access_message", "To use the body assessment, you need a personalised access link from your coach. Please contact your coach to get started.")}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[rgba(47,47,43,0.14)] bg-transparent px-5 py-3 text-sm font-medium text-[#2F2F2B] transition-colors hover:border-[#2F2F2B]"
            >
              {t("scan.access_home", "Back to home")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const form = useForm({
    resolver: zodResolver(fullScanSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const { trigger, handleSubmit } = form;

  const handleNext = async () => {
    const fields = STEP_FIELD_NAMES[currentStep];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (idx) => {
    if (idx < currentStep) {
      setDirection(-1);
      setCurrentStep(idx);
    }
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setCustomerName(formData.name);
    setAnalysisProgress(0);
    setActiveAnalysisStep(0);

    // Animate progress steps
    const stepTimings = [
      { step: 0, progress: 12, delay: 400 },
      { step: 1, progress: 35, delay: 2000 },
      { step: 2, progress: 58, delay: 4000 },
      { step: 3, progress: 78, delay: 6000 },
      { step: 4, progress: 92, delay: 8000 },
    ];

    const timers = stepTimings.map(({ step, progress, delay }) =>
      setTimeout(() => {
        setActiveAnalysisStep(step);
        setAnalysisProgress(progress);
      }, delay)
    );
    progressRef.current = timers;

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          chatIDs,
          botIndex,
          accountIDs,
          contactIDs,
          lng: lang,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");

      setAnalysisProgress(100);
      setActiveAnalysisStep(5);
      await new Promise((r) => setTimeout(r, 600));

      toast.success(t("scan.complete_toast", "Submission complete!"));
      setSubmitComplete(true);
    } catch (error) {
      toast.error(error.message || t("common.error"));
    } finally {
      timers.forEach(clearTimeout);
      setIsSubmitting(false);
    }
  };

  const StepComponent = STEP_COMPONENTS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;
  const meta = STEP_META[currentStep];
  const pct = Math.round(((currentStep + 1) / TOTAL_STEPS) * 100);

  const variants = {
    enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  // Analyzing overlay — premium dark screen
  if (isSubmitting) {
    const ANALYSIS_STEPS = [
      { key: "analyzing_step_1", fallback: "Calculating BMI & body composition" },
      { key: "analyzing_step_2", fallback: "Estimating body fat percentage" },
      { key: "analyzing_step_3", fallback: "Mapping waist-to-hip ratio" },
      { key: "analyzing_step_4", fallback: "Computing caloric & macro targets" },
      { key: "analyzing_step_5", fallback: "Composing your health plan" },
    ];

    return (
      <div
        className="flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #060F1F 0%, #2F2F2B 60%, #6B5B4B 100%)",
          color: "white",
          margin: "-1px -9999px", padding: "0 9999px",
        }}
      >
        {/* Decorative arcs */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1280 800" preserveAspectRatio="none" style={{ opacity: 0.15 }}>
          <circle cx="640" cy="400" r="200" fill="none" stroke="#C7A977" strokeWidth="1" />
          <circle cx="640" cy="400" r="320" fill="none" stroke="#C7A977" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="640" cy="400" r="440" fill="none" stroke="#C7A977" strokeWidth="1" />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center text-center px-6"
        >
          {/* Eyebrow */}
          <div className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: "#C7A977" }}>
            {t("scan.analyzing_label", "ASSESSMENT · ANALYZING")}
          </div>

          {/* Title */}
          <h1 className="mt-3 text-[clamp(36px,6vw,56px)] leading-[1.05]" style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}>
            {t("scan.analyzing_title", "Reading your body…")}
          </h1>

          {/* Subtitle */}
          <p className="mt-3.5 max-w-[480px] text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            {t("scan.analyzing_subtitle", "Calculating composition, estimating body fat, cross-checking your nutrition snapshot. Roughly 30 seconds.")}
          </p>

          {/* Score Ring */}
          <div className="mt-12 relative">
            <svg width={260} height={260}>
              <circle cx={130} cy={130} r={120} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
              <circle
                cx={130} cy={130} r={120} fill="none" stroke="#C7A977" strokeWidth={6}
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 - (analysisProgress / 100) * 2 * Math.PI * 120}
                strokeLinecap="round"
                transform="rotate(-90 130 130)"
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 64, fontWeight: 400, lineHeight: 1 }}>
                {Math.round(analysisProgress)}<span className="text-[24px]" style={{ color: "rgba(255,255,255,0.5)" }}>%</span>
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: "#C7A977" }}>
                {activeAnalysisStep < ANALYSIS_STEPS.length
                  ? t(`scan.${ANALYSIS_STEPS[activeAnalysisStep].key}`, ANALYSIS_STEPS[activeAnalysisStep].fallback).toUpperCase()
                  : t("scan.analyzing_complete_label", "COMPLETE").toUpperCase()
                }
              </div>
            </div>
          </div>

          {/* Status feed */}
          <div className="mt-14 flex flex-col gap-2 items-center">
            {ANALYSIS_STEPS.map((step, i) => {
              const isDone = i < activeAnalysisStep;
              const isActive = i === activeAnalysisStep;
              return (
                <div key={i} className="flex items-center gap-2.5 text-[13px]" style={{
                  color: isDone ? "rgba(255,255,255,0.5)" : isActive ? "white" : "rgba(255,255,255,0.3)",
                }}>
                  {isDone ? (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C7A977" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : isActive ? (
                    <span className="w-[14px] h-[14px] rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C7A977", borderTopColor: "transparent" }} />
                  ) : (
                    <span className="w-[14px] h-[14px] rounded-full" style={{ border: "1px solid rgba(255,255,255,0.2)" }} />
                  )}
                  <span>{t(`scan.${step.key}`, step.fallback)}</span>
                </div>
              );
            })}
          </div>

          {/* Cancel */}
          <button
            onClick={() => { progressRef.current?.forEach(clearTimeout); setIsSubmitting(false); }}
            className="mt-12 text-[13px] font-medium px-5 py-2.5 rounded-full transition-colors"
            style={{ color: "white", border: "1px solid rgba(255,255,255,0.25)", background: "transparent" }}
          >
            {t("scan.analyzing_cancel", "Cancel")}
          </button>
        </motion.div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Submission complete
  if (submitComplete) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-lg rounded-3xl border border-[rgba(47,47,43,0.10)] bg-white p-8 shadow-sm"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--status-good-bg)" }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--status-good-hex)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2
            className="mb-4 text-[28px] text-[#2F2F2B]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, lineHeight: 1.2 }}
          >
            {t("scan.complete_title", "Submission complete!")}
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#6B5B4B] whitespace-pre-line" style={{ fontFamily: "var(--font-inter)" }}>
            {t("scan.step7.open_results", "Hello {{customerName}},\n\nThank you for completing the questionnaire and trusting us with your body assessment!\n\nVery soon, the person who invited you to the study will contact you to share the report results.\n\nCompleting this information is the first step. We will be in touch with you soon!\n\nKind regards.", { customerName })}
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[rgba(47,47,43,0.14)] bg-transparent px-5 py-3 text-sm font-medium text-[#2F2F2B] transition-colors hover:border-[#2F2F2B]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {t("scan.complete_home", "Back to home")}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px]" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "56px", padding: "48px 32px 80px" }}>
      {/* ===== LEFT RAIL ===== */}
      <aside className="hidden md:block" style={{ position: "sticky", top: "96px", alignSelf: "start" }}>
        <div
          className="inline-flex items-center gap-2.5 mb-3"
          style={{ fontFamily: "var(--font-inter)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6B5B4B" }}
        >
          <span style={{ width: "24px", height: "1px", background: "#9B8573" }} />
          {t("scan.rail_eyebrow", "Body assessment")}
        </div>

        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontSize: "36px", color: "#2F2F2B", margin: "0 0 6px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          {t("scan.rail_title_1", "Tell us about")} <em style={{ fontStyle: "italic", color: "#9B8573", fontWeight: 400 }}>{t("scan.rail_title_2", "your body.")}</em>
        </h1>
        <p style={{ fontSize: "13.5px", color: "#6B5B4B", lineHeight: 1.55, margin: "0 0 24px" }}>
          {t("scan.rail_sub", "Three short steps. Takes about five minutes — your health assessment is built from this.")}
        </p>

        {/* Progress bar */}
        <div style={{ height: "4px", borderRadius: "999px", background: "rgba(155,133,115,0.18)", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #C7A977 0%, #9B8573 100%)",
            borderRadius: "999px",
            transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
          }} />
        </div>
        <div className="flex justify-between mb-7" style={{ fontFamily: "var(--font-inter)", fontSize: "11px", letterSpacing: "0.06em", color: "#6B5B4B" }}>
          <span>{t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}</span>
          <span>{pct}%</span>
        </div>

        {/* Timeline */}
        <ol className="relative" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <div style={{
            position: "absolute", left: "14px", top: "16px", bottom: "16px", width: "2px",
            background: "rgba(155,133,115,0.18)", borderRadius: "2px",
          }} />
          {STEP_META.map((s, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <li key={i} className="relative" style={{ padding: "0 0 4px 44px" }}>
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={i > currentStep}
                  className="w-full flex items-center text-left"
                  style={{
                    padding: "9px 12px 9px 0", background: "transparent", border: 0,
                    fontFamily: "var(--font-inter)", fontSize: "13.5px",
                    color: isDone || isActive ? "#2F2F2B" : "#6B5B4B",
                    borderRadius: "8px", cursor: i <= currentStep ? "pointer" : "default",
                    opacity: i > currentStep ? 0.5 : 1,
                  }}
                >
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      left: 0, top: "6px", width: "30px", height: "30px", borderRadius: "50%",
                      fontSize: "12px", fontWeight: 600,
                      background: isDone ? "#8D9A84" : isActive ? "#9B8573" : "white",
                      border: isDone ? "none" : isActive ? "none" : "1.5px solid rgba(155,133,115,0.30)",
                      color: isDone || isActive ? "white" : "#9B8573",
                      boxShadow: isActive ? "0 0 0 5px rgba(155,133,115,0.18)" : "none",
                      transform: isActive ? "scale(1.06)" : "none",
                      transition: "all 220ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    {isDone ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: "10px", letterSpacing: "0.14em",
                      textTransform: "uppercase", color: isActive ? "#9B8573" : "#6B5B4B",
                    }}>
                      {t("scan.step_label", "Step")} {i + 1}
                    </span>
                    <span style={{ fontWeight: isActive ? 600 : 500 }}>
                      {t(`scan.${s.key}.nav`, s.label)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* ===== STAGE (right column) ===== */}
      <section
        className="flex flex-col overflow-hidden"
        style={{
          background: "white", border: "1px solid rgba(47,47,43,0.10)",
          borderRadius: "24px", boxShadow: "0 1px 2px rgba(47,47,43,0.04)",
          minHeight: "620px",
        }}
      >
        {/* Stage header */}
        <div
          className="flex flex-wrap items-end justify-between gap-6"
          style={{
            padding: "32px 40px 24px",
            borderBottom: "1px solid rgba(47,47,43,0.10)",
            background: "linear-gradient(180deg, #F8F6F2 0%, white 100%)",
          }}
        >
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 mb-2"
              style={{ fontFamily: "var(--font-inter)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9B8573" }}
            >
              <span style={{ width: "18px", height: "1px", background: "#9B8573" }} />
              {t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}
            </div>
            <h2 style={{
              fontFamily: "var(--font-fraunces)", fontWeight: 400,
              fontSize: "clamp(28px, 3.2vw, 38px)", color: "#2F2F2B",
              margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em",
            }}>
              {t(`scan.${meta.key}.display_title`, meta.title)}{" "}
              <em style={{ fontStyle: "italic", color: "#9B8573", fontWeight: 400 }}>
                {t(`scan.${meta.key}.display_title_em`, meta.titleEm)}
              </em>
            </h2>
            <p style={{ margin: "8px 0 0", color: "#6B5B4B", fontSize: "14px", maxWidth: "60ch", lineHeight: 1.55 }}>
              {t(`scan.${meta.key}.display_sub`, meta.sub)}
            </p>
          </div>
        </div>

        {/* Stage body */}
        <div className="flex-1" style={{ padding: "32px 40px" }}>
          <form onSubmit={handleSubmit(onSubmit)} id="scan-form">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <StepComponent form={form} t={t} />
              </motion.div>
            </AnimatePresence>
          </form>
        </div>

        {/* Stage footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-4"
          style={{
            padding: "18px 40px 22px",
            borderTop: "1px solid rgba(47,47,43,0.10)",
            background: "#F8F6F2",
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="inline-flex items-center justify-center gap-2"
            style={{
              fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500,
              padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
              border: "1.5px solid rgba(47,47,43,0.16)", background: "transparent",
              color: "#2F2F2B", cursor: isFirstStep ? "not-allowed" : "pointer",
              opacity: isFirstStep ? 0.45 : 1,
              transition: "transform 180ms, border-color 180ms",
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {t("navigation.previous", "Previous")}
          </button>

          <span className="hidden sm:inline-flex items-center gap-2.5" style={{
            fontFamily: "var(--font-inter)", fontSize: "12px", color: "#6B5B4B", whiteSpace: "nowrap",
          }}>
            {t("scan.step_label", "Step")} {currentStep + 1} · {t(`scan.${meta.key}.nav`, meta.label)}
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(47,47,43,0.16)" }} />
            {t("scan.time_estimate", "about 5 min total")}
          </span>

          {isLastStep ? (
            <button
              type="submit"
              form="scan-form"
              className="inline-flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500,
                padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
                border: 0, background: "#9B8573", color: "white", cursor: "pointer",
                transition: "transform 180ms, box-shadow 320ms, background 180ms",
              }}
            >
              {t("navigation.submit", "Send")}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500,
                padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
                border: 0, background: "#9B8573", color: "white", cursor: "pointer",
                transition: "transform 180ms, box-shadow 320ms, background 180ms",
              }}
            >
              {t("navigation.next", "Next")}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          )}
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 980px) {
          .mx-auto.max-w-\\[1280px\\] {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            padding: 32px 20px 64px !important;
          }
        }
        @media (max-width: 600px) {
          .flex.flex-wrap.items-end.justify-between {
            padding: 24px 22px 18px !important;
          }
          .flex-1[style*="padding: 32px 40px"] {
            padding: 24px 22px !important;
          }
          .flex.flex-wrap.items-center.justify-between[style*="padding: 18px 40px"] {
            padding: 16px 22px 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
