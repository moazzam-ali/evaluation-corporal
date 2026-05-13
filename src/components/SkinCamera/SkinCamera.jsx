"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

export default function SkinCamera({ onImageCapture, activeTab, setActiveTab }) {
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      onImageCapture(imageSrc);
    }
  }, [onImageCapture]);

  const retake = () => {
    setCapturedImage(null);
    onImageCapture(null);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result);
        onImageCapture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageCapture]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Tab switcher */}
      <div
        className="inline-flex self-start"
        style={{
          background: "#E3E8F0", padding: "4px", borderRadius: "14px",
          border: "1px solid rgba(11,27,51,0.10)",
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab("camera"); setUploadedImage(null); onImageCapture(capturedImage); }}
          className="inline-flex items-center gap-2"
          style={{
            padding: "10px 18px", borderRadius: "10px", border: 0, cursor: "pointer",
            fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
            background: activeTab === "camera" ? "white" : "transparent",
            color: activeTab === "camera" ? "#0B1B33" : "#5A6B85",
            boxShadow: activeTab === "camera" ? "0 2px 6px rgba(11,27,51,0.08)" : "none",
            transition: "background 220ms, color 220ms, box-shadow 220ms",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          {t("scan.camera_tab", "Capture with Camera")}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("upload"); setCapturedImage(null); onImageCapture(uploadedImage); }}
          className="inline-flex items-center gap-2"
          style={{
            padding: "10px 18px", borderRadius: "10px", border: 0, cursor: "pointer",
            fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
            background: activeTab === "upload" ? "white" : "transparent",
            color: activeTab === "upload" ? "#0B1B33" : "#5A6B85",
            boxShadow: activeTab === "upload" ? "0 2px 6px rgba(11,27,51,0.08)" : "none",
            transition: "background 220ms, color 220ms, box-shadow 220ms",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {t("scan.upload_tab", "Upload Photo")}
        </button>
      </div>

      {/* Camera pane */}
      {activeTab === "camera" && (
        <div className="flex flex-col gap-[18px]">
          <div
            className="relative overflow-hidden"
            style={{
              aspectRatio: "4 / 3", borderRadius: "18px",
              background: "linear-gradient(160deg, #1B2A47 0%, #0B1B33 100%)",
              border: "1.5px solid rgba(11,27,51,0.16)",
            }}
          >
            {capturedImage ? (
              <>
                <img src={capturedImage} alt={t("scan.photo_alt_captured", "Captured")} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                  <button
                    type="button"
                    onClick={retake}
                    style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
                      padding: "10px 20px", borderRadius: "999px",
                      background: "rgba(255,255,255,0.94)", color: "#0B1B33",
                      border: 0, cursor: "pointer", backdropFilter: "blur(6px)",
                    }}
                  >
                    {t("scan.retake", "Retake")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="absolute inset-0 w-full h-full object-cover"
                  mirrored
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div style={{ width: "48%", aspectRatio: "0.74", border: "2px dashed rgba(255,255,255,0.55)", borderRadius: "50%" }} />
                </div>
                {/* Camera status */}
                <span
                  className="absolute top-3.5 left-3.5 inline-flex items-center gap-2"
                  style={{
                    background: "rgba(11,27,51,0.65)", backdropFilter: "blur(8px)",
                    color: "white", padding: "6px 12px", borderRadius: "999px",
                    fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF5C7A", boxShadow: "0 0 0 3px rgba(255,92,122,0.30)" }} />
                  {t("scan.camera_live", "Live")}
                </span>
                {/* Shutter button */}
                <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={capture}
                    style={{
                      width: "64px", height: "64px", borderRadius: "50%",
                      background: "white", border: "4px solid rgba(255,255,255,0.5)",
                      cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,0.30)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{ width: "50px", height: "50px", borderRadius: "50%", background: "white", boxShadow: "inset 0 0 0 2px #2C5BFF", display: "block" }} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Help banner */}
          <div
            className="flex gap-3 items-start"
            style={{ background: "#E6ECFF", border: "1px solid rgba(44,91,255,0.20)", borderRadius: "14px", padding: "14px 16px" }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "white", color: "#2C5BFF" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <p style={{ margin: 0, fontSize: "13px", color: "#2D2D40", lineHeight: 1.55 }}>
              <strong style={{ color: "#0B1B33", fontWeight: 600 }}>{t("scan.camera_help_title", "Hold steady — we auto-capture the sharpest frame.")}</strong>{" "}
              {t("scan.camera_help_body", "Make sure your full face is visible inside the dashed oval, with even lighting on both sides.")}
            </p>
          </div>
        </div>
      )}

      {/* Upload pane */}
      {activeTab === "upload" && (
        <div className="flex flex-col gap-[18px]">
          {uploadedImage ? (
            <div className="relative" style={{ borderRadius: "18px", overflow: "hidden" }}>
              <img src={uploadedImage} alt={t("scan.photo_alt_uploaded", "Uploaded")} className="w-full" />
              <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={() => { setUploadedImage(null); onImageCapture(null); }}
                  style={{
                    fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
                    padding: "10px 20px", borderRadius: "999px",
                    background: "rgba(255,255,255,0.94)", color: "#0B1B33",
                    border: 0, cursor: "pointer", backdropFilter: "blur(6px)",
                  }}
                >
                  {t("scan.retake", "Change photo")}
                </button>
              </div>
            </div>
          ) : (
            <label
              {...getRootProps()}
              className="flex flex-col items-center justify-center text-center cursor-pointer"
              style={{
                border: isDragActive ? "2px solid #2C5BFF" : "2px dashed rgba(11,27,51,0.16)",
                borderRadius: "18px", padding: "56px 24px",
                background: isDragActive ? "#E6ECFF" : "#F8FAFE",
                minHeight: "320px",
                transition: "border-color 220ms, background 220ms",
              }}
            >
              <input {...getInputProps()} />
              <span
                className="inline-flex items-center justify-center"
                style={{ width: "64px", height: "64px", borderRadius: "18px", background: "white", border: "1px solid rgba(11,27,51,0.10)", color: "#2C5BFF", marginBottom: "16px" }}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </span>
              <span style={{ fontFamily: "var(--font-fraunces)", fontSize: "22px", fontWeight: 400, color: "#0B1B33", lineHeight: 1.25 }}>
                {t("scan.upload_title_1", "Drag & drop your photo here,")} <em style={{ fontStyle: "italic", color: "#2C5BFF" }}>{t("scan.upload_title_2", "or click to browse.")}</em>
              </span>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5A6B85", marginTop: "8px" }}>
                {t("scan.upload_formats", "JPG, PNG · up to 10 MB")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: "13px", fontWeight: 500,
                  color: "white", background: "#2C5BFF", padding: "9px 18px",
                  borderRadius: "999px", marginTop: "16px",
                }}
              >
                {t("scan.upload_browse", "Choose file")}
              </span>
            </label>
          )}

          {/* Help banner */}
          <div
            className="flex gap-3 items-start"
            style={{ background: "#E6ECFF", border: "1px solid rgba(44,91,255,0.20)", borderRadius: "14px", padding: "14px 16px" }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "white", color: "#2C5BFF" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <p style={{ margin: 0, fontSize: "13px", color: "#2D2D40", lineHeight: 1.55 }}>
              <strong style={{ color: "#0B1B33", fontWeight: 600 }}>{t("scan.upload_help_title", "Photos are processed, never permanently stored.")}</strong>{" "}
              {t("scan.upload_help_body", "Only the JSON analysis and your email are kept. Images are auto-deleted within 24 hours.")}
            </p>
          </div>
        </div>
      )}

      {/* Photo tips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>, text: t("scan.tip1", "Use natural lighting") },
          { icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>, text: t("scan.tip2", "Remove glasses and hats") },
          { icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>, text: t("scan.tip3", "Face the camera directly") },
          { icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>, text: t("scan.tip4", "Full face must be visible") },
        ].map((tip, i) => (
          <div
            key={i}
            className="flex flex-col gap-2"
            style={{ background: "#F8FAFE", border: "1px solid rgba(11,27,51,0.10)", borderRadius: "12px", padding: "14px" }}
          >
            <span
              className="inline-flex items-center justify-center"
              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#E6ECFF", color: "#2C5BFF" }}
            >
              {tip.icon}
            </span>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12.5px", fontWeight: 500, color: "#0B1B33", lineHeight: 1.35 }}>
              {tip.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
