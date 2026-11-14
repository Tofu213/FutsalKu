import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = process.env.JWT_SECRET || "dev-secret-jangan-dipakai-di-produksi";
const COOKIE_NAME = "futsal_session";

export function buatToken(user) {
  return jwt.sign(
    { id: user.id, nama: user.nama, role: user.role },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function setSessionCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export function hapusSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

// Mengambil data sesi dari cookie (dipakai di Server Component / Route Handler)
export function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.id } });
}

export function requireRole(session, roles) {
  if (!session) return false;
  return roles.includes(session.role);
}
