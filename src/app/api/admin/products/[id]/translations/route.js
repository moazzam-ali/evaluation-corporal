import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getTranslationsForProduct, upsertTranslation, deleteTranslation } from "@/lib/products";

export async function GET(_, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const translations = await getTranslationsForProduct(id);
  return NextResponse.json({ translations });
}

export async function PUT(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { language, data } = await request.json();

    if (!language || !data) {
      return NextResponse.json({ error: "language and data are required" }, { status: 400 });
    }

    await upsertTranslation(id, language, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { language } = await request.json();

    if (!language) {
      return NextResponse.json({ error: "language is required" }, { status: 400 });
    }

    await deleteTranslation(id, language);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
