"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

const videoConstraints = {
  width: 720,
  height: 1280,
  facingMode: "user",
};

/**
 * Full-body camera + file-upload composite for the scan flow's photo step.
 *
 * Props:
 *  - onImageCapture(dataUrl | null)
 *  - activeTab: "camera" | "upload"
 *  - setActiveTab(tab)
 */
export default function BodyCamera({ onImageCapture, activeTab, setActiveTab }) {
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError(null);
      onImageCapture(imageSrc);
    }
  }, [onImageCapture]);

  const retake = () => {
    setCapturedImage(null);
    onImageCapture(null);
  };

  const onDrop = useCallback(
    (acceptedFiles, rejections) => {
      if (rejections?.length) {
        const reason = rejections[0].errors?.[0]?.code === "file-too-large"
          ? t("body_camera.error_too_large", "Photo must be under 12 MB.")
          : t("body_camera.error_invalid", "Use a JPEG or PNG photo.");
        setError(reason);
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result);
        setError(null);
        onImageCapture(reader.result);
      };
      reader.onerror = () =>
        setError(t("body_camera.error_read", "Could not read the file. Try another."));
      reader.readAsDataURL(file);
    },
    [onImageCapture, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: 12 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Tab switcher */}
      <div
        className="inline-flex self-start"
        style={{
          background: "#E4D9C6",
          padding: "4px",
          borderRadius: "14px",
          border: "1px solid rgba(47,47,43,0.10)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab("camera");
            setUploadedImage(null);
            onImageCapture(capturedImage);
          }}
          className="inline-flex items-center gap-2"
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: 0,
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            fontWeight: 500,
            background: activeTab === "camera" ? "white" : "transparent",
            color: activeTab === "camera" ? "#2F2F2B" : "#6B5B4B",
            boxShadow: activeTab === "camera" ? "0 2px 6px rgba(47,47,43,0.08)" : "none",
            transition: "background 220ms, color 220ms, box-shadow 220ms",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {t("body_camera.tab_camera", "Use camera")}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
            setCapturedImage(null);
            onImageCapture(uploadedImage);
          }}
          className="inline-flex items-center gap-2"
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: 0,
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            fontWeight: 500,
            background: activeTab === "upload" ? "white" : "transparent",
            color: activeTab === "upload" ? "#2F2F2B" : "#6B5B4B",
            boxShadow: activeTab === "upload" ? "0 2px 6px rgba(47,47,43,0.08)" : "none",
            transition: "background 220ms, color 220ms, box-shadow 220ms",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {t("body_camera.tab_upload", "Upload photo")}
        </button>
      </div>

      {/* Camera pane */}
      {activeTab === "camera" && (
        <div className="flex flex-col gap-[18px]">
          <div
            className="relative overflow-hidden mx-auto"
            style={{
              aspectRatio: "3 / 4",
              width: "100%",
              maxWidth: 380,
              borderRadius: "18px",
              background: "linear-gradient(160deg, #4A4A42 0%, #2F2F2B 100%)",
              border: "1.5px solid rgba(47,47,43,0.16)",
            }}
          >
            {capturedImage ? (
              <>
                <img src={capturedImage} alt={t("body_camera.photo_captured", "Captured")} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                  <button
                    type="button"
                    onClick={retake}
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      fontWeight: 500,
                      padding: "10px 20px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.94)",
                      color: "#2F2F2B",
                      border: 0,
                      cursor: "pointer",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {t("body_camera.retake", "Retake")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.88}
                  videoConstraints={videoConstraints}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Full-body silhouette guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 200 380" width="55%" preserveAspectRatio="xMidYMid meet" style={{ opacity: 0.55 }}>
                    <path
                      d="M100 20 C 88 20 80 30 80 44 C 80 56 86 64 92 68 L 88 76 C 70 80 56 90 54 110 L 50 150 C 48 162 50 174 56 184 L 60 200 L 56 240 C 56 250 60 258 64 264 L 60 320 C 60 332 64 344 70 354 L 76 366 L 90 366 L 92 354 L 90 320 L 92 270 L 100 270 L 108 270 L 110 320 L 108 354 L 110 366 L 124 366 L 130 354 C 136 344 140 332 140 320 L 136 264 C 140 258 144 250 144 240 L 140 200 L 144 184 C 150 174 152 162 150 150 L 146 110 C 144 90 130 80 112 76 L 108 68 C 114 64 120 56 120 44 C 120 30 112 20 100 20 Z"
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="1.4"
                      strokeDasharray="6 6"
                    />
                  </svg>
                </div>
                <span
                  className="absolute top-3.5 left-3.5 inline-flex items-center gap-2"
                  style={{
                    background: "rgba(47,47,43,0.65)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#9C5A4A", boxShadow: "0 0 0 3px rgba(156,90,74,0.30)" }} />
                  {t("body_camera.live", "Live")}
                </span>
                {/* Shutter */}
                <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={capture}
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "white",
                      border: "4px solid rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.30)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label={t("body_camera.capture", "Capture")}
                  >
                    <span style={{ width: "50px", height: "50px", borderRadius: "50%", background: "white", boxShadow: "inset 0 0 0 2px #9B8573", display: "block" }} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Help banner */}
          <div
            className="flex gap-3 items-start"
            style={{ background: "#EFE7DC", border: "1px solid rgba(155,133,115,0.20)", borderRadius: "14px", padding: "14px 16px" }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "white", color: "#9B8573" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <p style={{ margin: 0, fontSize: "13px", color: "#4A4A42", lineHeight: 1.55 }}>
              <strong style={{ color: "#2F2F2B", fontWeight: 600 }}>
                {t("body_camera.camera_tip_title", "Stand 2 meters from the camera.")}
              </strong>{" "}
              {t("body_camera.camera_tip_body", "Wear fitted clothing, keep arms slightly away from your body, and frame from head to ankles inside the dotted outline.")}
            </p>
          </div>
        </div>
      )}

      {/* Upload pane */}
      {activeTab === "upload" && (
        <div className="flex flex-col gap-[18px]">
          {uploadedImage ? (
            <div
              className="relative overflow-hidden mx-auto"
              style={{
                aspectRatio: "3 / 4",
                width: "100%",
                maxWidth: 380,
                borderRadius: "18px",
                border: "1.5px solid rgba(47,47,43,0.16)",
              }}
            >
              <img src={uploadedImage} alt={t("body_camera.photo_uploaded", "Uploaded")} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={() => { setUploadedImage(null); onImageCapture(null); }}
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "10px 20px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.94)",
                    color: "#2F2F2B",
                    border: 0,
                    cursor: "pointer",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {t("body_camera.replace", "Replace photo")}
                </button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className="mx-auto flex flex-col items-center justify-center text-center cursor-pointer"
              style={{
                aspectRatio: "3 / 4",
                width: "100%",
                maxWidth: 380,
                borderRadius: "18px",
                border: isDragActive ? "2px solid #9B8573" : "2px dashed rgba(47,47,43,0.20)",
                background: isDragActive ? "#EFE7DC" : "#F8F6F2",
                padding: "24px",
                transition: "border-color 220ms, background 220ms",
              }}
            >
              <input {...getInputProps()} />
              <span
                className="inline-flex items-center justify-center mb-4"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  background: "white",
                  border: "1px solid rgba(47,47,43,0.10)",
                  color: "#9B8573",
                }}
              >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-fraunces)", fontSize: "22px", fontWeight: 400, color: "#2F2F2B", lineHeight: 1.25 }}>
                {t("body_camera.upload_title_1", "Drop your full-body photo here,")}{" "}
                <em style={{ fontStyle: "italic", color: "#9B8573" }}>
                  {t("body_camera.upload_title_2", "or click to browse.")}
                </em>
              </span>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B5B4B", marginTop: "10px" }}>
                {t("body_camera.upload_subtitle", "JPEG · PNG · WEBP · 12 MB max")}
              </span>
            </div>
          )}

          {error && (
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#9C5A4A", textAlign: "center" }}>{error}</p>
          )}

          <div
            className="flex gap-3 items-start"
            style={{ background: "#EFE7DC", border: "1px solid rgba(155,133,115,0.20)", borderRadius: "14px", padding: "14px 16px" }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0"
              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "white", color: "#9B8573" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <p style={{ margin: 0, fontSize: "13px", color: "#4A4A42", lineHeight: 1.55 }}>
              <strong style={{ color: "#2F2F2B", fontWeight: 600 }}>
                {t("body_camera.upload_tip_title", "Photos are processed in private.")}
              </strong>{" "}
              {t("body_camera.upload_tip_body", "We never store the raw image after analysis — only the secure URL of an anonymized copy you can delete any time.")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
