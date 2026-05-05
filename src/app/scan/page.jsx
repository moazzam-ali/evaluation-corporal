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
import useAnalysisStore from "@/store/analysisStore";
import { compressImage, dataUrlToBlob, validateImage } from "@/lib/image-utils";
import { fullScanSchema, STEP_FIELD_NAMES, DEFAULT_VALUES } from "@/lib/schemas/scan-schemas";

import Step1BasicInfo from "@/components/Steps/Step1BasicInfo";
import Step2MainGoal from "@/components/Steps/Step2MainGoal";
import Step3SkinPerception from "@/components/Steps/Step3SkinPerception";
import Step4CurrentRoutine from "@/components/Steps/Step4CurrentRoutine";
import Step5Sensitivity from "@/components/Steps/Step5Sensitivity";
import Step6Habits from "@/components/Steps/Step6Habits";
import Step7PastExperience from "@/components/Steps/Step7PastExperience";
import Step8GoalsCommercial from "@/components/Steps/Step8GoalsCommercial";
import Step9PhotoUpload from "@/components/Steps/Step9PhotoUpload";

const STEP_COMPONENTS = [
  Step1BasicInfo, Step2MainGoal, Step3SkinPerception,
  Step4CurrentRoutine, Step5Sensitivity, Step6Habits,
  Step7PastExperience, Step8GoalsCommercial, Step9PhotoUpload,
];

const TOTAL_STEPS = STEP_COMPONENTS.length;
const ANALYSIS_TIMEOUT = 55000;

const STEP_META = [
  { label: "Basic Info",       title: "Basic",           titleEm: "information",          sub: "Tell us about yourself — we use this to tailor your report and reach you with results." },
  { label: "Main Goal",        title: "Your",            titleEm: "main goal",            sub: "Pick up to three concerns. The first answer ranks your product order; the rest fine-tune it." },
  { label: "Skin Perception",  title: "How you",         titleEm: "perceive your skin",   sub: "How you describe your skin matters — we cross-reference it with what the camera sees later." },
  { label: "Routine",          title: "Your",            titleEm: "current routine",      sub: "We won't ask you to throw anything away. We'll plug into what's already working." },
  { label: "Sensitivity",      title: "Sensitivity &",   titleEm: "tolerance",            sub: "How forgiving your skin is shapes which actives we recommend, and at what concentration." },
  { label: "Habits",           title: "Habits that",     titleEm: "affect your skin",     sub: "Sleep, sun, and water are bigger inputs than most products. We weigh them." },
  { label: "Experience",       title: "Your",            titleEm: "past experience",      sub: "We learn from what didn't work as much as from what did." },
  { label: "Goals",            title: "Your",            titleEm: "goals",                sub: "How much routine, and at what level of investment — so the recommendations actually fit." },
  { label: "Photo",            title: "Upload your",     titleEm: "photo",                sub: "Take a clear photo of your face or upload an existing one for the AI analysis." },
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
  const [imageData, setImageData] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const abortControllerRef = useRef(null);

  const chatIDs = searchParams.get("n")?.split(",").filter(Boolean) || [];
  const botIndex = searchParams.get("b") || "1";
  const accountIDs = searchParams.get("a")?.split(",").filter(Boolean) || [];
  const contactIDs = searchParams.get("c")?.split(",").filter(Boolean) || [];
  const lang = searchParams.get("l") || i18n.language || "en";

  // Gate: require config params to proceed
  const hasRequiredParams = chatIDs.length > 0 && accountIDs.length > 0 && contactIDs.length > 0;

  if (!hasRequiredParams) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div
          className="mx-auto w-full max-w-md rounded-3xl border border-[rgba(26,26,46,0.10)] bg-white p-8 shadow-sm"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FDEEF1]">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E8728A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2
            className="mb-2 text-[28px] text-[#1A1A2E]"
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, lineHeight: 1.2 }}
          >
            {t("scan.access_title", "Access required")}
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#6B6B7A]">
            {t("scan.access_message", "To use the skin scanner, you need a personalised access link from your coach. Please contact your coach to get started.")}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[rgba(26,26,46,0.14)] bg-transparent px-5 py-3 text-sm font-medium text-[#1A1A2E] transition-colors hover:border-[#1A1A2E]"
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
    if (!imageData) {
      toast.error(t("scan.no_photo", "Please capture or upload a photo first."));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(5);

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 8));
    }, 1500);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

    try {
      setAnalysisProgress(10);
      const validation = await validateImage(imageData);
      if (!validation.valid) throw new Error(validation.error || "Invalid image");

      setAnalysisProgress(15);
      const compressed = await compressImage(imageData, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });

      setAnalysisProgress(20);
      const blob = dataUrlToBlob(compressed);

      const submitData = new FormData();
      submitData.append("image", blob, "skin-photo.jpg");
      submitData.append("formData", JSON.stringify(formData));
      submitData.append("chatIDs", JSON.stringify(chatIDs));
      submitData.append("botIndex", botIndex);
      submitData.append("accountIDs", JSON.stringify(accountIDs));
      submitData.append("contactIDs", JSON.stringify(contactIDs));
      submitData.append("lng", lang);

      setAnalysisProgress(30);
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: submitData,
        signal: controller.signal,
      });

      setAnalysisProgress(85);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Analysis failed");

      setAnalysisProgress(100);
      useAnalysisStore.getState().setAnalysisFromResponse({ results: result.results, formData, imageUrl: imageData });
      toast.success(t("scan.complete_toast", "Analysis complete!"));
      setAnalysisComplete(true);
    } catch (error) {
      if (error.name === "AbortError") {
        toast.error(t("common.timeout", "Analysis took too long. Please try again."));
      } else {
        toast.error(error.message || t("common.error"));
      }
    } finally {
      clearTimeout(timeout);
      clearInterval(progressInterval);
      abortControllerRef.current = null;
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const cancelAnalysis = () => abortControllerRef.current?.abort();

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

  // Analyzing overlay
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "70vh" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="mb-6">
            <AnimatedLogo size={140} />
          </div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 300, color: "#1A1A2E" }}>
            {t("scan.analyzing", "Analyzing your skin...")}
          </p>
          <div className="mt-6 w-full max-w-xs">
            <div style={{ height: "4px", borderRadius: "999px", background: "rgba(232,114,138,0.18)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${analysisProgress}%`,
                  background: "linear-gradient(90deg, #F4A7B9 0%, #E8728A 100%)",
                  borderRadius: "999px",
                  transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <p className="mt-2 text-center" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.06em", color: "#6B6B7A" }}>
              {Math.round(analysisProgress)}%
            </p>
          </div>
          <button
            onClick={cancelAnalysis}
            className="mt-4"
            style={{
              fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
              color: "#6B6B7A", padding: "8px 16px", borderRadius: "999px",
              border: "1.5px solid rgba(26,26,46,0.16)", background: "transparent", cursor: "pointer",
            }}
          >
            {t("common.cancel", "Cancel")}
          </button>
        </motion.div>
      </div>
    );
  }

  // Analysis complete — tell user their coach will share results
  if (analysisComplete) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md rounded-3xl border border-[rgba(26,26,46,0.10)] bg-white p-8 shadow-sm"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F1ED]">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#5B9A8B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2
            className="mb-2 text-[28px] text-[#1A1A2E]"
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, lineHeight: 1.2 }}
          >
            {t("scan.complete_title", "Analysis complete!")}
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-[#6B6B7A]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {t("scan.complete_message", "Your skin analysis has been processed successfully. Your coach will share the detailed results with you shortly. Please contact your coach to receive your personalised report and product recommendations.")}
          </p>
          <div className="rounded-xl border border-[rgba(232,114,138,0.2)] bg-[#FDEEF1] px-4 py-3 text-[13px] leading-relaxed text-[#D45571]" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {t("scan.complete_hint", "Your coach has been notified and will reach out with your results.")}
          </div>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[rgba(26,26,46,0.14)] bg-transparent px-5 py-3 text-sm font-medium text-[#1A1A2E] transition-colors hover:border-[#1A1A2E]"
              style={{ fontFamily: "var(--font-dm-sans)" }}
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
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2.5 mb-3"
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6B6B7A" }}
        >
          <span style={{ width: "24px", height: "1px", background: "#E8728A" }} />
          {t("scan.rail_eyebrow", "Skin analysis")}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, fontSize: "36px", color: "#1A1A2E", margin: "0 0 6px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          {t("scan.rail_title_1", "Tell us about")} <em style={{ fontStyle: "italic", color: "#E8728A", fontWeight: 400 }}>{t("scan.rail_title_2", "your skin.")}</em>
        </h1>
        <p style={{ fontSize: "13.5px", color: "#6B6B7A", lineHeight: 1.55, margin: "0 0 24px" }}>
          {t("scan.rail_sub", "Eight short steps and one photo. Takes about three minutes — your routine is built from this.")}
        </p>

        {/* Progress bar */}
        <div style={{ height: "4px", borderRadius: "999px", background: "rgba(232,114,138,0.18)", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, #F4A7B9 0%, #E8728A 100%)",
            borderRadius: "999px",
            transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
          }} />
        </div>
        <div className="flex justify-between mb-7" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.06em", color: "#6B6B7A" }}>
          <span>{t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}</span>
          <span>{pct}%</span>
        </div>

        {/* Timeline */}
        <ol className="relative" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {/* Connecting line */}
          <div style={{
            position: "absolute", left: "14px", top: "16px", bottom: "16px", width: "2px",
            background: "rgba(232,114,138,0.18)", borderRadius: "2px",
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
                    fontFamily: "var(--font-dm-sans)", fontSize: "13.5px",
                    color: isDone || isActive ? "#1A1A2E" : "#6B6B7A",
                    borderRadius: "8px", cursor: i <= currentStep ? "pointer" : "default",
                    opacity: i > currentStep ? 0.5 : 1,
                  }}
                >
                  {/* Number circle */}
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      left: 0, top: "6px", width: "30px", height: "30px", borderRadius: "50%",
                      fontSize: "12px", fontWeight: 600,
                      background: isDone ? "#5B9A8B" : isActive ? "#E8728A" : "white",
                      border: isDone ? "none" : isActive ? "none" : "1.5px solid rgba(232,114,138,0.30)",
                      color: isDone || isActive ? "white" : "#E8728A",
                      boxShadow: isActive ? "0 0 0 5px rgba(232,114,138,0.18)" : "none",
                      transform: isActive ? "scale(1.06)" : "none",
                      transition: "all 220ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    {isDone ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.14em",
                      textTransform: "uppercase", color: isActive ? "#E8728A" : "#6B6B7A",
                    }}>
                      {t("scan.step_label", "Step")} {i + 1}
                    </span>
                    <span style={{ fontWeight: isActive ? 600 : 500 }}>
                      {t(`scan.step${i + 1}.nav`, s.label)}
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
          background: "white", border: "1px solid rgba(26,26,46,0.10)",
          borderRadius: "24px", boxShadow: "0 1px 2px rgba(26,26,46,0.04)",
          minHeight: "720px",
        }}
      >
        {/* Stage header */}
        <div
          className="flex flex-wrap items-end justify-between gap-6"
          style={{
            padding: "32px 40px 24px",
            borderBottom: "1px solid rgba(26,26,46,0.10)",
            background: "linear-gradient(180deg, #FDF8F3 0%, white 100%)",
          }}
        >
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 mb-2"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#E8728A" }}
            >
              <span style={{ width: "18px", height: "1px", background: "#E8728A" }} />
              {t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}
            </div>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontWeight: 300,
              fontSize: "clamp(28px, 3.2vw, 38px)", color: "#1A1A2E",
              margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em",
            }}>
              {t(`scan.step${currentStep + 1}.display_title`, meta.title)}{" "}
              <em style={{ fontStyle: "italic", color: "#E8728A", fontWeight: 400 }}>
                {t(`scan.step${currentStep + 1}.display_title_em`, meta.titleEm)}
              </em>
            </h2>
            <p style={{ margin: "8px 0 0", color: "#6B6B7A", fontSize: "14px", maxWidth: "60ch", lineHeight: 1.55 }}>
              {t(`scan.step${currentStep + 1}.display_sub`, meta.sub)}
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
                {isLastStep ? (
                  <StepComponent
                    imageData={imageData}
                    setImageData={setImageData}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    t={t}
                  />
                ) : (
                  <StepComponent form={form} t={t} />
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>

        {/* Stage footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-4"
          style={{
            padding: "18px 40px 22px",
            borderTop: "1px solid rgba(26,26,46,0.10)",
            background: "#FDF8F3",
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="inline-flex items-center justify-center gap-2"
            style={{
              fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
              padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
              border: "1.5px solid rgba(26,26,46,0.16)", background: "transparent",
              color: "#1A1A2E", cursor: isFirstStep ? "not-allowed" : "pointer",
              opacity: isFirstStep ? 0.45 : 1,
              transition: "transform 180ms, border-color 180ms",
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {t("scan.navigation.previous", "Previous")}
          </button>

          <span className="hidden sm:inline-flex items-center gap-2.5" style={{
            fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#6B6B7A", whiteSpace: "nowrap",
          }}>
            {t("scan.step_label", "Step")} {currentStep + 1} · {t(`scan.step${currentStep + 1}.nav`, meta.label)}
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(26,26,46,0.16)" }} />
            {t("scan.time_estimate", "about 3 min total")}
          </span>

          {isLastStep ? (
            <button
              type="submit"
              form="scan-form"
              disabled={!imageData}
              className="inline-flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
                padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
                border: 0, background: "#E8728A", color: "white",
                cursor: !imageData ? "not-allowed" : "pointer",
                opacity: !imageData ? 0.45 : 1,
                transition: "transform 180ms, box-shadow 320ms, background 180ms",
              }}
            >
              {t("scan.navigation.analyze", "Analyze My Skin")}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
                padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
                border: 0, background: "#E8728A", color: "white", cursor: "pointer",
                transition: "transform 180ms, box-shadow 320ms, background 180ms",
              }}
            >
              {t("scan.navigation.next", "Next")}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          )}
        </div>
      </section>

      {/* Mobile-only: show progress + step info below nav on small screens */}
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
