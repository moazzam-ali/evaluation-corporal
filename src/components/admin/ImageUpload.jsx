"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ImageUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/products/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        onChange(data.url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  const clearImage = (e) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div
      {...getRootProps()}
      className={`relative flex min-h-[120px] cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : value
            ? "border-border"
            : "border-border hover:border-foreground/30"
      } ${uploading || disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xs">Uploading...</span>
        </div>
      ) : value ? (
        <div className="group relative w-full">
          <img
            src={value}
            alt="Product"
            className="mx-auto max-h-[160px] rounded object-contain p-2"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs font-medium text-white">Click or drop to replace</span>
          </div>
          <button
            type="button"
            onClick={clearImage}
            className="absolute right-1 top-1 rounded-full bg-destructive/90 p-1 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
          <Upload className="h-6 w-6" />
          <span className="text-xs">
            {isDragActive ? "Drop image here" : "Drop image or click to upload"}
          </span>
          <span className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP - max 5MB</span>
        </div>
      )}
    </div>
  );
}
