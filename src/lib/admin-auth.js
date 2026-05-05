// Lightweight admin auth using HMAC-signed cookies.
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query } from "./db";

const COOKIE_NAME = "bg_admin_session";
const SESSION_DAYS = 7;

function getSecret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET not set");
  return s;
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function loginAdmin(email, password) {
  const r = await query(
    "SELECT id, email, name, role, password_hash, is_active FROM admins WHERE email = $1",
    [email]
  );
  if (r.rows.length === 0) return null;
  const admin = r.rows[0];
  if (!admin.is_active) return null;

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;

  await query("UPDATE admins SET last_login_at = NOW() WHERE id = $1", [admin.id]);

  const token = sign({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function changeAdminPassword(email, newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  const r = await query(
    "UPDATE admins SET password_hash = $1 WHERE email = $2 RETURNING id",
    [hash, email]
  );
  return r.rows.length > 0;
}
