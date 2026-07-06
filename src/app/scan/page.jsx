"use client";

import { Suspense, useState, useRef, useEffect } from "react";
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
import Step7BodyPhoto from "@/components/Steps/Step7BodyPhoto";
import Step7FinalSubmission from "@/components/Steps/Step7FinalSubmission";

const STEP_COMPONENTS = [
  Step1PersonalInfo, Step2PhysicalInfo, Step3DietNutrition,
  Step4ActivityHydration, Step5HealthConditions, Step6GoalsCare,
  Step7BodyPhoto, Step7FinalSubmission,
];

const TOTAL_STEPS = STEP_COMPONENTS.length;

const STEP_META = [
  { key: "step1", label: "Personal Info", title: "Personal", titleEm: "information", sub: "Tell us about yourself — we use this to tailor your report and reach you with results." },
  { key: "step2", label: "Physical Info", title: "Physical", titleEm: "information", sub: "Your body measurements help us calculate your health metrics accurately." },
  { key: "step3", label: "Diet & Nutrition", title: "Diet &", titleEm: "nutrition", sub: "What you eat shapes everything — we start here." },
  { key: "step4", label: "Activity", title: "Activity &", titleEm: "hydration", sub: "How you move and how much you drink — two big levers." },
  { key: "step5", label: "Health", title: "Health", titleEm: "conditions", sub: "Select anything that applies — we use this to tailor product recommendations." },
  { key: "step6", label: "Goals", title: "Goals &", titleEm: "care", sub: "What you're aiming for, and what you're already doing." },
  { key: "photo", label: "Body photo", title: "Add a", titleEm: "body photo", sub: "Optional — one full-body photo gives the AI a deeper read on posture and composition." },
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
  const [isSubmitting, setIsSubmitting] = useState(false);    // analyzing overlay — covers form save + analysis
  const [submitComplete, setSubmitComplete] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeAnalysisStep, setActiveAnalysisStep] = useState(0);
  const progressRef = useRef(null);

  // Body photo — captured on the photo step (before review), kept locally in
  // state until the review step sends everything in one go. The upload tab is
  // the default: auto-starting the camera on step entry crashes some in-app
  // browsers (Telegram/Instagram WebViews) and prompts for permission before
  // the user asked for it.
  const [photoTab, setPhotoTab] = useState("upload");
  const [bodyImage, setBodyImage] = useState(null);

  const cleanID = (s) => { const n = Number(s); return s && !isNaN(n) ? String(Math.trunc(n)) : s; };
  const urlChatIDs = searchParams.get("n")?.split(",").map((s) => cleanID(s.trim())).filter(Boolean) || [];
  const urlBotIndex = cleanID(searchParams.get("b") || "1");
  const urlAccountIDs = searchParams.get("a")?.split(",").map((s) => cleanID(s.trim())).filter(Boolean) || [];
  const urlContactIDs = searchParams.get("c")?.split(",").map((s) => cleanID(s.trim())).filter(Boolean) || [];
  const urlHasParams = urlChatIDs.length > 0 && urlAccountIDs.length > 0 && urlContactIDs.length > 0;

  // The coach's access params survive a reload: in-app browsers sometimes
  // recover from a crash or "reload" onto the URL without the query string,
  // which used to strand people on the "Access required" screen mid-attempt.
  const ACCESS_KEY = "scan-access-params";
  const [storedAccess] = useState(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(window.sessionStorage.getItem(ACCESS_KEY) || "null"); } catch { return null; }
  });
  useEffect(() => {
    if (!urlHasParams) return;
    try {
      window.sessionStorage.setItem(ACCESS_KEY, JSON.stringify({
        chatIDs: urlChatIDs, botIndex: urlBotIndex, accountIDs: urlAccountIDs, contactIDs: urlContactIDs,
      }));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlHasParams, searchParams]);

  const access = urlHasParams
    ? { chatIDs: urlChatIDs, botIndex: urlBotIndex, accountIDs: urlAccountIDs, contactIDs: urlContactIDs }
    : storedAccess;
  const chatIDs = access?.chatIDs || [];
  const botIndex = access?.botIndex || "1";
  const accountIDs = access?.accountIDs || [];
  const contactIDs = access?.contactIDs || [];
  const lang = searchParams.get("l") || i18n.language || "en";

  // ?sr=1 → "show results" testing toggle: skip photo, auto-analyze, redirect to results page.
  const showResults = searchParams.get("sr") === "1";

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

  const runAnalyzingAnimation = (durations = [400, 2000, 4000, 6000, 8000]) => {
    setAnalysisProgress(0);
    setActiveAnalysisStep(0);
    const stepTimings = [12, 35, 58, 78, 92].map((progress, step) => ({ step, progress, delay: durations[step] }));
    const timers = stepTimings.map(({ step, progress, delay }) =>
      setTimeout(() => {
        setActiveAnalysisStep(step);
        setAnalysisProgress(progress);
      }, delay)
    );
    progressRef.current = timers;
    return () => timers.forEach(clearTimeout);
  };

  // Run the body analysis. This is what notifies the coach (Telegram, with the
  // results link) and indexes the lead (Elastic) — so it must run whether or not
  // a photo is added. The CRM/chat params are forwarded so the coach is reached.
  const runBodyAnalysis = async ({ formData, image, formId }) => {
    const res = await fetch("/api/analyze-body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData,
        image,
        language: lang,
        formId,
        chatIDs,
        botIndex,
        accountIDs,
        contactIDs,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.id) throw new Error(result.error || `Analysis failed (${res.status})`);
    return result;
  };

  // After analysis: the end user is NOT taken to the results page — they see the
  // "your coach will reach out" screen. The results page only opens automatically
  // when the ?sr=1 ("show results") URL flag is present (internal/testing use).
  const finishAfterAnalysis = async (result) => {
    setAnalysisProgress(100);
    setActiveAnalysisStep(5);
    await new Promise((r) => setTimeout(r, 700));
    if (showResults) {
      router.push(`/results/${result.id}?lang=${lang}`);
    } else {
      setIsSubmitting(false);
      setSubmitComplete(true);
    }
  };

  // Single submit from the review step: save the form, then run the analysis
  // with the photo captured on the previous step (or without one). The
  // analyzing overlay covers the whole backend flow.
  const onSubmit = async (formData) => {
    setCustomerName(formData.name);
    setIsSubmitting(true);
    const cancel = runAnalyzingAnimation([400, 1600, 3200, 5000, 7000]);

    // 1. Store the intake form. If this fails the submission is NOT sent —
    //    surface the error and stay on the review step so nothing is lost.
    let formId = null;
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
      // Guard the parse: a timed-out/proxied response returns non-JSON (HTML),
      // and an unguarded res.json() throw here is what "broke" submissions.
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || `Submission failed (${res.status})`);
      formId = result.id;
    } catch (error) {
      cancel();
      setIsSubmitting(false);
      toast.error(error.message || t("common.error"));
      return;
    }

    // 2. Analysis (photo optional). The form is already stored, so a failure
    //    here still ends on the completion screen — the coach follows up.
    try {
      const result = await runBodyAnalysis({ formData, image: bodyImage, formId });
      cancel();
      await finishAfterAnalysis(result);
    } catch (error) {
      cancel();
      setIsSubmitting(false);
      toast.error(error.message || t("scan.analyze_error", "Could not analyze your photo. We saved your form — your coach will follow up."));
      setSubmitComplete(true);
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

  // Analyzing overlay — minimal, focused on the animated brand mark.
  // Component lives at the bottom of this file.
  if (isSubmitting) {
    return <AnalyzingOverlay t={t} onCancel={() => { progressRef.current?.forEach(clearTimeout); setIsSubmitting(false); }} />;
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
    <div className="mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[320px_1fr] gap-8 md:gap-10 lg:gap-14 px-5 pt-8 pb-16 sm:px-6 md:px-8 md:pt-12 md:pb-20">
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
          className="flex flex-wrap items-end justify-between gap-6 px-5 pt-6 pb-5 sm:px-10 sm:pt-8 sm:pb-6"
          style={{
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
        <div className="flex-1 px-5 py-6 sm:px-10 sm:py-8">
          {/* The form is wired only as a container for react-hook-form's
              registration and validation. We never want native submit to
              fire on its own — Enter inside any input would otherwise post
              the form and skip past the review step. Submission is driven
              exclusively by the Send button's onClick. */}
          <form
            id="scan-form"
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target?.tagName !== "TEXTAREA") {
                e.preventDefault();
              }
            }}
          >
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
                <StepComponent form={form} t={t} bodyImage={bodyImage} onImageCapture={setBodyImage} photoTab={photoTab} setPhotoTab={setPhotoTab} />
              </motion.div>
            </AnimatePresence>
          </form>
        </div>

        {/* Stage footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 px-5 pt-4 pb-5 sm:px-10 sm:pt-5 sm:pb-6"
          style={{
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
            // Explicit type="button" + onClick → never relies on native form
            // submit. Prevents the review step from being skipped by an
            // accidental Enter keypress or by click-event bleed-through when
            // the button swaps from "Next" to "Send".
            <button
              key="submit-btn"
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="inline-flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500,
                padding: "11px 20px", borderRadius: "999px", whiteSpace: "nowrap",
                border: 0, background: "#9B8573", color: "white",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                transition: "transform 180ms, box-shadow 320ms, background 180ms, opacity 180ms",
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-[14px] h-[14px] rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {t("navigation.sending", "Sending…")}
                </>
              ) : (
                <>
                  {t("navigation.submit", "Send")}
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </>
              )}
            </button>
          ) : (
            <button
              key="next-btn"
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

    </div>
  );
}

/**
 * AnalyzingOverlay — minimal full-screen analyzing state shown while the
 * body-photo analysis API runs. Renders as a fixed overlay so it sits on top
 * of the form regardless of scroll, locks body scroll, and resets the window
 * scroll to top so the previous form-screen scroll position doesn't bleed
 * through.
 */
function AnalyzingOverlay({ t, onCancel }) {
  useEffect(() => {
    // Reset scroll position and lock the body while the overlay is up.
    const prevOverflow = document.body.style.overflow;
    const prevScroll = window.scrollY;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      // Restore the user's previous scroll position only if they're not
      // navigating away; harmless either way.
      window.scrollTo({ top: prevScroll, left: 0, behavior: "auto" });
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center px-6"
      style={{
        background: "linear-gradient(160deg, #1A1A18 0%, #2F2F2B 55%, #4A3F36 100%)",
        color: "white",
      }}
    >
      <AnimatedLogo size={260} duration={5.2} />

      <h1
        className="mt-6 text-[clamp(28px,5vw,42px)] leading-[1.1]"
        style={{ fontFamily: "var(--font-fraunces)", fontWeight: 400 }}
      >
        {t("scan.analyzing_title", "Analyzing…")}
      </h1>

      <p
        className="mt-2 max-w-[340px] text-[14px] leading-relaxed"
        style={{ color: "rgba(239,231,220,0.6)" }}
      >
        {t("scan.analyzing_subtitle_simple", "Hang tight — this takes about 30 seconds.")}
      </p>

      <button
        onClick={onCancel}
        className="mt-10 text-[13px] font-medium px-5 py-2.5 rounded-full transition-colors"
        style={{
          color: "rgba(239,231,220,0.85)",
          border: "1px solid rgba(239,231,220,0.22)",
          background: "transparent",
        }}
      >
        {t("scan.analyzing_cancel", "Cancel")}
      </button>
    </div>
  );
}
