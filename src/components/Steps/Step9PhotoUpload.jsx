"use client";

import SkinCamera from "@/components/SkinCamera/SkinCamera";

export default function Step9PhotoUpload({ imageData, setImageData, activeTab, setActiveTab, t }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">{t("scan.step9.title", "Upload Your Photo")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("scan.step9.subtitle", "Take a clear photo of your face or upload an existing one for the AI analysis.")}
      </p>

      <SkinCamera
        onImageCapture={setImageData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
