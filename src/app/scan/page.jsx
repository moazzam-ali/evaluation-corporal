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
import Step3HabitsInfo from "@/components/Steps/Step3HabitsInfo";
import Step4FinalSubmission from "@/components/Steps/Step4FinalSubmission";

const STEP_COMPONENTS = [
  Step1PersonalInfo, Step2PhysicalInfo, Step3HabitsInfo, Step4FinalSubmission,
];

const TOTAL_STEPS = STEP_COMPONENTS.length;

const STEP_META = [
  { key: "step1", label: "Personal Info", title: "Personal", titleEm: "information", sub: "Tell us about yourself — we use this to tailor your report and reach you with results." },
  { key: "step2", label: "Physical Info", title: "Physical", titleEm: "information", sub: "Your body measurements help us calculate your health metrics accurately." },
  { key: "step3", label: "Habits", title: "Lifestyle &", titleEm: "health", sub: "Diet, exercise, and daily habits — the inputs that shape your plan." },
  { key: "step4", label: "Review", title: "Ready to", titleEm: "send?", sub: "Review your information and make sure everything is correct." },
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
          className="mx-auto w-full max-w-md rounded-3xl border border-[rgba(11,27,51,0.10)] bg-white p-8 shadow-sm"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6ECFF]">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#2C5BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2
            className="mb-2 text-[28px] text-[#0B1B33]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, lineHeight: 1.2 }}
          >
            {t("scan.access_title", "Access required")}
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#5A6B85]">
            {t("scan.access_message", "To use the body assessment, you need a personalised access link from your coach. Please contact your coach to get started.")}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[rgba(11,27,51,0.14)] bg-transparent px-5 py-3 text-sm font-medium text-[#0B1B33] transition-colors hover:border-[#0B1B33]"
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

      toast.success(t("scan.complete_toast", "Submission complete!"));
      setSubmitComplete(true);
    } catch (error) {
      toast.error(error.message || t("common.error"));
    } finally {
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

  // Submitting overlay
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "70vh" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="mb-6">
            <AnimatedLogo size={140} />
          </div>
          <p style={{ fontFamily: "var(--font-fraunces)", fontSize: "24px", fontWeight: 400, color: "#0B1B33" }}>
            {t("navigation.submitting", "Sending...")}
          </p>
        </motion.div>
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
          className="mx-auto w-full max-w-lg rounded-3xl border border-[rgba(11,27,51,0.10)] bg-white p-8 shadow-sm"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--status-good-bg)" }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--status-good-hex)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2
            className="mb-4 text-[28px] text-[#0B1B33]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, lineHeight: 1.2 }}
          >
            {t("scan.complete_title", "Submission complete!")}
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#5A6B85] whitespace-pre-line" style={{ fontFamily: "var(--font-inter)" }}>
            {t("scan.step4.open_results", "Hello {{customerName}},\n\nThank you for completing the questionnaire and trusting us with your body assessment!\n\nVery soon, the person who invited you to the study will contact you to share the report results.\n\nCompleting this information is the first step. We will be in touch with you soon!\n\nKind regards.", { customerName })}
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[rgba(11,27,51,0.14)] bg-transparent px-5 py-3 text-sm font-medium text-[#0B1B33] transition-colors hover:border-[#0B1B33]"
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
          style={{ fontFamily: "var(--font-inter)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#5A6B85" }}
        >
          <span style={{ width: "24px", height: "1px", background: "#2C5BFF" }} />
          {t("scan.rail_eyebrow", "Body assessment")}
        </div>

        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400, fontSize: "36px", color: "#0B1B33", margin: "0 0 6px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          {t("scan.rail_title_1", "Tell us about")} <em style={{ fontStyle: "italic", color: "#2C5BFF", fontWeight: 400 }}>{t("scan.rail_title_2", "your body.")}</em>
        </h1>
        <p style={{ fontSize: "13.5px", color: "#5A6B85", lineHeight: 1.55, margin: "0 0 24px" }}>
          {t("scan.rail_sub", "Three short steps. Takes about five minutes — your health assessment is built from this.")}
        </p>

        {/* Progress bar */}
        <div style={{ height: "4px", borderRadius: "999px", background: "rgba(44,91,255,0.18)", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #6FA0FF 0%, #2C5BFF 100%)",
            borderRadius: "999px",
            transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
          }} />
        </div>
        <div className="flex justify-between mb-7" style={{ fontFamily: "var(--font-inter)", fontSize: "11px", letterSpacing: "0.06em", color: "#5A6B85" }}>
          <span>{t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}</span>
          <span>{pct}%</span>
        </div>

        {/* Timeline */}
        <ol className="relative" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <div style={{
            position: "absolute", left: "14px", top: "16px", bottom: "16px", width: "2px",
            background: "rgba(44,91,255,0.18)", borderRadius: "2px",
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
                    color: isDone || isActive ? "#0B1B33" : "#5A6B85",
                    borderRadius: "8px", cursor: i <= currentStep ? "pointer" : "default",
                    opacity: i > currentStep ? 0.5 : 1,
                  }}
                >
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      left: 0, top: "6px", width: "30px", height: "30px", borderRadius: "50%",
                      fontSize: "12px", fontWeight: 600,
                      background: isDone ? "#2E8B6B" : isActive ? "#2C5BFF" : "white",
                      border: isDone ? "none" : isActive ? "none" : "1.5px solid rgba(44,91,255,0.30)",
                      color: isDone || isActive ? "white" : "#2C5BFF",
                      boxShadow: isActive ? "0 0 0 5px rgba(44,91,255,0.18)" : "none",
                      transform: isActive ? "scale(1.06)" : "none",
                      transition: "all 220ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    {isDone ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span style={{
                      fontFamily: "var(--font-inter)", fontSize: "10px", letterSpacing: "0.14em",
                      textTransform: "uppercase", color: isActive ? "#2C5BFF" : "#5A6B85",
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
          background: "white", border: "1px solid rgba(11,27,51,0.10)",
          borderRadius: "24px", boxShadow: "0 1px 2px rgba(11,27,51,0.04)",
          minHeight: "620px",
        }}
      >
        {/* Stage header */}
        <div
          className="flex flex-wrap items-end justify-between gap-6"
          style={{
            padding: "32px 40px 24px",
            borderBottom: "1px solid rgba(11,27,51,0.10)",
            background: "linear-gradient(180deg, #F8FAFE 0%, white 100%)",
          }}
        >
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 mb-2"
              style={{ fontFamily: "var(--font-inter)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#2C5BFF" }}
            >
              <span style={{ width: "18px", height: "1px", background: "#2C5BFF" }} />
              {t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}
            </div>
            <h2 style={{
              fontFamily: "var(--font-fraunces)", fontWeight: 400,
              fontSize: "clamp(28px, 3.2vw, 38px)", color: "#0B1B33",
              margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em",
            }}>
              {t(`scan.${meta.key}.display_title`, meta.title)}{" "}
              <em style={{ fontStyle: "italic", color: "#2C5BFF", fontWeight: 400 }}>
                {t(`scan.${meta.key}.display_title_em`, meta.titleEm)}
              </em>
            </h2>
            <p style={{ margin: "8px 0 0", color: "#5A6B85", fontSize: "14px", maxWidth: "60ch", lineHeight: 1.55 }}>
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
            borderTop: "1px solid rgba(11,27,51,0.10)",
            background: "#F8FAFE",
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
              border: "1.5px solid rgba(11,27,51,0.16)", background: "transparent",
              color: "#0B1B33", cursor: isFirstStep ? "not-allowed" : "pointer",
              opacity: isFirstStep ? 0.45 : 1,
              transition: "transform 180ms, border-color 180ms",
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {t("navigation.previous", "Previous")}
          </button>

          <span className="hidden sm:inline-flex items-center gap-2.5" style={{
            fontFamily: "var(--font-inter)", fontSize: "12px", color: "#5A6B85", whiteSpace: "nowrap",
          }}>
            {t("scan.step_label", "Step")} {currentStep + 1} · {t(`scan.${meta.key}.nav`, meta.label)}
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(11,27,51,0.16)" }} />
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
                border: 0, background: "#2C5BFF", color: "white", cursor: "pointer",
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
                border: 0, background: "#2C5BFF", color: "white", cursor: "pointer",
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
