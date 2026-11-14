import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { daftarJam, jamValid, TANGGAL_RE } from "@/lib/util";

// UC-06 Blokir Jadwal (Owner)
export async function GET(req) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const lapanganId = searchParams.get("lapanganId") || undefined;
  const tanggal = searchParams.get("tanggal") || undefined;
  const data = await prisma.jadwalBlokir.findMany({
    where: { lapanganId, tanggal },
    include: { lapangan: { select: { nama: true } } },
    orderBy: [{ tanggal: "asc" }, { jam: "asc" }],
  });
  return NextResponse.json(data);
}

export async function POST(req) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner yang dapat memblokir jadwal." }, { status: 403 });
  }

  const body = await req.json();
  const { lapanganId, tanggal, alasan } = body;
  const jamMulai = Number(body.jamMulai);
  const jumlahJam = Number(body.jumlahJam || 1);
  if (!lapanganId || !tanggal || !TANGGAL_RE.test(tanggal) || !jamValid(jamMulai, jumlahJam)) {
    return NextResponse.json({ error: "Data blokir tidak valid." }, { status: 400 }); // A1
  }

  const jam = daftarJam(jamMulai, jumlahJam);
  // langkah 2 / A2: tolak jika slot sudah dibooking
  const terisi = await prisma.slotBooking.findFirst({ where: { lapanganId, tanggal, jam: { in: jam } } });
  if (terisi) {
    return NextResponse.json({ error: "Slot sudah dibooking, tidak dapat diblokir." }, { status: 409 });
  }

  await prisma.jadwalBlokir.createMany({
    data: jam.map((j) => ({ lapanganId, tanggal, jam: j, alasan: alasan || null })),
    skipDuplicates: true,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
