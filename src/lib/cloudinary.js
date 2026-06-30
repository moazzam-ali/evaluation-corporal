export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_UPLOAD_PRESET &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadToCloudinary(imageBuffer, filename, { folder = "body-analysis" } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary not configured (missing CLOUDINARY_* env vars).");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  // Create signature for signed upload (params MUST be alphabetical)
  const { createHash } = await import("crypto");
  const signatureString = `folder=${folder}&invalidate=true&timestamp=${timestamp}&upload_preset=${uploadPreset}${apiSecret}`;
  const signature = createHash("sha1").update(signatureString).digest("hex");

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: "image/jpeg" });
  formData.append("file", blob, filename || "body-photo.jpg");
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);
  formData.append("invalidate", "true");
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const data = await response.json();
  const url = data.secure_url || data.url;
  if (!url) {
    throw new Error(`Cloudinary upload returned no URL. Response: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return {
    url,
    publicId: data.public_id,
  };
}
