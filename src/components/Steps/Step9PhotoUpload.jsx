"use client";

import SkinCamera from "@/components/SkinCamera/SkinCamera";

export default function Step9PhotoUpload({ imageData, setImageData, activeTab, setActiveTab, t }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <SkinCamera
        onImageCapture={setImageData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
