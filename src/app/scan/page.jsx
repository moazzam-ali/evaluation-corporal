"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Sparkles, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8"><div className="flex items-center justify-center py-20"><AnimatedLogo size={100} /></div></div>}>
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
  const abortControllerRef = useRef(null);

  // URL params from config page
  const chatIDs = searchParams.get("n")?.split(",").filter(Boolean) || [];
  const botIndex = searchParams.get("b") || "1";
  const accountIDs = searchParams.get("a")?.split(",").filter(Boolean) || [];
  const contactIDs = searchParams.get("c")?.split(",").filter(Boolean) || [];
  const lang = searchParams.get("l") || i18n.language || "en";

  const form = useForm({
    resolver: zodResolver(fullScanSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const { trigger, handleSubmit } = form;

  // Navigation
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

  // Final submission
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
      toast.success(t("results.title", "Analysis complete!"));
      router.push(`/results/${result.id}`);
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

  // Current step component
  const StepComponent = STEP_COMPONENTS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  // Step titles for progress display
  const stepTitles = [
    t("scan.step1.nav", "Basic Info"),
    t("scan.step2.nav", "Main Goal"),
    t("scan.step3.nav", "Skin Perception"),
    t("scan.step4.nav", "Routine"),
    t("scan.step5.nav", "Sensitivity"),
    t("scan.step6.nav", "Habits"),
    t("scan.step7.nav", "Experience"),
    t("scan.step8.nav", "Goals"),
    t("scan.step9.nav", "Photo"),
  ];

  // Animation variants
  const variants = {
    enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  if (isAnalyzing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
          <div className="mb-6">
            <AnimatedLogo size={140} />
          </div>
          <p className="text-lg font-medium">{t("scan.analyzing")}</p>
          <div className="mt-6 w-full max-w-xs">
            <Progress value={analysisProgress} className="h-2" />
            <p className="mt-2 text-center text-xs text-muted-foreground">{Math.round(analysisProgress)}%</p>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelAnalysis} className="mt-4 text-muted-foreground">
            {t("common.cancel", "Cancel")}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Progress header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{stepTitles[currentStep]}</span>
          <span className="text-muted-foreground">
            {t("scan.navigation.step_of", "Step {{current}} of {{total}}", { current: currentStep + 1, total: TOTAL_STEPS })}
          </span>
        </div>
        <Progress value={((currentStep + 1) / TOTAL_STEPS) * 100} className="h-2" />
      </div>

      {/* Step content with animations */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            {currentStep === TOTAL_STEPS - 1 ? (
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

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("scan.navigation.previous", "Previous")}
          </Button>

          {isLastStep ? (
            <Button type="submit" size="lg" className="gap-2" disabled={!imageData}>
              <Sparkles className="h-5 w-5" />
              {t("scan.navigation.analyze", "Analyze My Skin")}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} className="gap-2">
              {t("scan.navigation.next", "Next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
