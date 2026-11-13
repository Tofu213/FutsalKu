import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buatToken, setSessionCookie } from "@/lib/auth";

// FR-02: Login multi-peran (Owner, Kasir, Penyewa)
// Kondisi khusus: setelah 5 kali gagal, akun terkunci sementara (disederhanakan
// di versi demo ini menjadi pengecekan password biasa; gunakan tabel percobaan
// login terpisah jika ingin mengaktifkan penguncian akun secara penuh).
export async function POST(req) {
  const { noHp, password } = await req.json();

  if (!noHp || !password) {
    return NextResponse.json(
      { error: "Nomor HP dan password wajib diisi." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { noHp } });
  if (!user) {
    return NextResponse.json(
      { error: "Nomor HP atau password salah." },
      { status: 401 }
    );
  }

  const cocok = await bcrypt.compare(password, user.password);
  if (!cocok) {
    return NextResponse.json(
      { error: "Nomor HP atau password salah." },
      { status: 401 }
    );
  }

  const token = buatToken(user);
  setSessionCookie(token);

  return NextResponse.json({ id: user.id, nama: user.nama, role: user.role });
}
