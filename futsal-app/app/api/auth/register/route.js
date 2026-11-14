import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buatToken, setSessionCookie } from "@/lib/auth";

// FR-01: Sistem harus memungkinkan calon penyewa mendaftar akun baru
export async function POST(req) {
  const body = await req.json();
  const { nama, noHp, email, password } = body;

  if (!nama || !noHp || !password) {
    return NextResponse.json(
      { error: "Nama, nomor HP, dan password wajib diisi." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { noHp } });
  if (existing) {
    return NextResponse.json(
      { error: "Nomor HP sudah terdaftar." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nama, noHp, email, password: hashed, role: "PELANGGAN" },
  });

  const token = buatToken(user);
  setSessionCookie(token);

  return NextResponse.json({
    id: user.id,
    nama: user.nama,
    role: user.role,
  });
}
