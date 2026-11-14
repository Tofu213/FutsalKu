import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { ambilPengaturan } from "@/lib/util";

// Aturan DP: dibaca semua pengguna login (ditampilkan saat booking/pembatalan), diubah Owner
export async function GET() {
  if (!getSession()) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }
  return NextResponse.json(await ambilPengaturan());
}

export async function PUT(req) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner yang dapat mengubah aturan." }, { status: 403 });
  }
  const { dpPersen, perlakuanDpBatal } = await req.json();
  const persen = Number(dpPersen);
  if (!Number.isInteger(persen) || persen < 10 || persen > 100 || !["HANGUS", "DIKEMBALIKAN"].includes(perlakuanDpBatal)) {
    return NextResponse.json({ error: "DP harus 10-100% dan perlakuan DP HANGUS/DIKEMBALIKAN." }, { status: 400 });
  }
  const data = { dpPersen: persen, perlakuanDpBatal };
  const p = await prisma.pengaturan.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  return NextResponse.json(p);
}
