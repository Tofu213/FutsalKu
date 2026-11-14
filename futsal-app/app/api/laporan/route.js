import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { TANGGAL_RE } from "@/lib/util";

// UC-07 Lihat Laporan Pendapatan (Owner). Laporan dihitung dari tabel Pembayaran
// (kelas LaporanPendapatan pada class diagram tidak disimpan sebagai tabel).
// Batas hari memakai zona waktu WIB (UTC+7).
export async function GET(req) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner yang dapat melihat laporan." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode") === "bulanan" ? "bulanan" : "harian";
  const tanggal = searchParams.get("tanggal");
  if (!tanggal || !TANGGAL_RE.test(tanggal)) {
    return NextResponse.json({ error: "Parameter tanggal (YYYY-MM-DD) wajib diisi." }, { status: 400 });
  }

  let awal, akhir;
  if (periode === "harian") {
    awal = new Date(`${tanggal}T00:00:00+07:00`);
    akhir = new Date(awal.getTime() + 24 * 60 * 60 * 1000);
  } else {
    const [y, m] = tanggal.split("-").map(Number);
    awal = new Date(`${tanggal.slice(0, 7)}-01T00:00:00+07:00`);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    akhir = new Date(`${next}-01T00:00:00+07:00`);
  }

  const [pembayaran, dibatalkan] = await Promise.all([
    prisma.pembayaran.findMany({
      where: { waktu: { gte: awal, lt: akhir } },
      include: {
        booking: {
          select: {
            tanggal: true, jamMulai: true, namaTamu: true,
            lapangan: { select: { nama: true } },
            user: { select: { nama: true } },
          },
        },
      },
      orderBy: { waktu: "asc" },
    }),
    prisma.booking.findMany({
      where: { status: "DIBATALKAN", dibatalkanAt: { gte: awal, lt: akhir }, perlakuanDp: "DIKEMBALIKAN" },
      select: { dpDibayar: true },
    }),
  ]);

  const dpDiterima = pembayaran.filter((p) => p.jenis === "DP").reduce((s, p) => s + p.nominal, 0);
  const pelunasan = pembayaran.filter((p) => p.jenis === "PELUNASAN").reduce((s, p) => s + p.nominal, 0);
  const dpDikembalikan = dibatalkan.reduce((s, b) => s + b.dpDibayar, 0);

  return NextResponse.json({
    periode, tanggal,
    dpDiterima, pelunasan, dpDikembalikan,
    pendapatanBersih: dpDiterima + pelunasan - dpDikembalikan,
    transaksi: pembayaran,
  });
}
