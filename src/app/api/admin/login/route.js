import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/admin-auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const admin = await loginAdmin(email, password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    return NextResponse.json({ admin });
  } catch (err) {
    console.error("[admin/login]", err.message);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
