import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "Image exceeds 5MB limit" }, { status: 400 });
    }

    // Validate magic bytes
    const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebP =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    if (!isJPEG && !isPNG && !isWebP) {
      return NextResponse.json({ error: "Invalid image format. Use JPEG, PNG, or WebP." }, { status: 400 });
    }

    const ext = isJPEG ? "jpg" : isPNG ? "png" : "webp";
    const filename = `product-${Date.now()}.${ext}`;

    const result = await uploadToCloudinary(buffer, filename, { folder: "products" });

    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (err) {
    console.error("[admin/upload-image] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
