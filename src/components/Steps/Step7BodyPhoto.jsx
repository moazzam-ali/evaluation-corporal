"use client";

import BodyCamera from "@/components/BodyCamera/BodyCamera";

/**
 * Step 7 — optional body photo, captured BEFORE the final review so the
 * whole submission (form + photo) goes out in one send. The image stays in
 * the parent page's state until the review step submits everything.
 */
export default function Step7BodyPhoto({ t, bodyImage, onImageCapture, photoTab, setPhotoTab }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-[rgba(155,133,115,0.2)] bg-[#EFE7DC] px-5 py-4">
        <p className="text-[13px] leading-relaxed" style={{ color: "#6B5B4B", fontFamily: "var(--font-inter)" }}>
          {t(
            "scan.photo.intro",
            "Optional — add one full-body photo and we'll combine it with your numbers for a deeper read on posture, composition and where to focus. No photo? Just continue to the next step."
          )}
        </p>
      </div>

      <BodyCamera
        onImageCapture={onImageCapture}
        activeTab={photoTab}
        setActiveTab={setPhotoTab}
      />

      {bodyImage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(47,47,43,0.10)] bg-white px-4 py-3">
          <span className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: "var(--status-good-hex, #8D9A84)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          </span>
          <span className="text-[13px]" style={{ color: "var(--ink, #2F2F2B)", fontFamily: "var(--font-inter)" }}>
            {t("scan.photo.attached", "Photo added — it will be analyzed when you send the form.")}
          </span>
        </div>
      )}
    </div>
  );
}
