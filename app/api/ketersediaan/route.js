import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kedaluwarsakanBooking } from "@/lib/util";

// UC-02 Lihat Ketersediaan Jadwal: jam terisi (booking aktif) dan jam ditutup Owner (blokir).
// jamTerisi = gabungan keduanya agar tampilan pelanggan sederhana; jamBlokir untuk label.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lapanganId = searchParams.get("lapanganId");
  const tanggal = searchParams.get("tanggal");

  if (!lapanganId || !tanggal) {
    return NextResponse.json(
      { error: "Parameter lapanganId dan tanggal wajib diisi." },
      { status: 400 }
    );
  }

  await kedaluwarsakanBooking();
  const [slots, blokir] = await Promise.all([
    prisma.slotBooking.findMany({ where: { lapanganId, tanggal }, select: { jam: true } }),
    prisma.jadwalBlokir.findMany({ where: { lapanganId, tanggal }, select: { jam: true } }),
  ]);

  const jamBooking = slots.map((s) => s.jam);
  const jamBlokir = blokir.map((b) => b.jam);
  const jamTerisi = Array.from(new Set([...jamBooking, ...jamBlokir])).sort((a, b) => a - b);

  return NextResponse.json({ jamTerisi, jamBlokir: jamBlokir.sort((a, b) => a - b) });
}
