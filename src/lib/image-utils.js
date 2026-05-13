/**
 * Compresses an image (base64 data URL) to a target max dimension and quality.
 * Returns a new base64 data URL (always JPEG).
 */
export function compressImage(dataUrl, { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // Scale down if needed, preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);

        // Verify it's a valid data URL
        if (!compressed || !compressed.startsWith("data:image/jpeg")) {
          reject(new Error("Image compression produced invalid output"));
          return;
        }

        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}

/**
 * Converts a base64 data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  if (!header || !base64) {
    throw new Error("Invalid data URL format");
  }

  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

/**
 * Validates that a data URL is a real image by checking its dimensions.
 */
export function validateImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        valid: img.width > 50 && img.height > 50,
        width: img.width,
        height: img.height,
        error: img.width <= 50 || img.height <= 50 ? "Image is too small" : null,
      });
    };
    img.onerror = () => {
      resolve({ valid: false, width: 0, height: 0, error: "Not a valid image file" });
    };
    img.src = dataUrl;
  });
}
