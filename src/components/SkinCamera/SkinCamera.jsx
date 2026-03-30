"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { Camera, Upload, RotateCcw, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "camera" ? "default" : "outline"}
          onClick={() => { setActiveTab("camera"); setUploadedImage(null); onImageCapture(capturedImage); }}
          className="flex-1 gap-2"
        >
          <Camera className="h-4 w-4" />
          {t("scan.camera_tab")}
        </Button>
        <Button
          variant={activeTab === "upload" ? "default" : "outline"}
          onClick={() => { setActiveTab("upload"); setCapturedImage(null); onImageCapture(uploadedImage); }}
          className="flex-1 gap-2"
        >
          <Upload className="h-4 w-4" />
          {t("scan.upload_tab")}
        </Button>
      </div>

      {/* Camera view */}
      {activeTab === "camera" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {capturedImage ? (
              <div className="relative">
                <img src={capturedImage} alt="Captured" className="w-full" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button onClick={retake} variant="secondary" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {t("scan.retake")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full"
                  mirrored
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-64 w-48 rounded-full border-2 border-dashed border-white/50" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button onClick={capture} size="lg" className="gap-2">
                    <Camera className="h-5 w-5" />
                    {t("scan.capture")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload view */}
      {activeTab === "upload" && (
        <Card>
          <CardContent className="p-0">
            {uploadedImage ? (
              <div className="relative">
                <img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button
                    onClick={() => { setUploadedImage(null); onImageCapture(null); }}
                    variant="secondary"
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("scan.retake")}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">{t("scan.upload_prompt")}</p>
                <p className="text-xs text-muted-foreground">{t("scan.upload_formats")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-muted/50 border-0">
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">{t("scan.tips_title")}</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>&#8226; {t("scan.tip1")}</li>
            <li>&#8226; {t("scan.tip2")}</li>
            <li>&#8226; {t("scan.tip3")}</li>
            <li>&#8226; {t("scan.tip4")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
