import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { kedaluwarsakanBooking, tanggalWibCompact, totalDibayar } from "@/lib/util";

// UC-05 Catat Pelunasan dan Terbitkan Nota (Kasir/Owner)
export async function POST(req, { params }) {
  const session = getSession();
  if (!requireRole(session, ["OWNER", "KASIR"])) {
    return NextResponse.json({ error: "Hanya Kasir/Owner yang dapat mencatat pelunasan." }, { status: 403 });
  }

  const { nominal, metode } = await req.json();
  await kedaluwarsakanBooking();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { pembayaran: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
  }
  if (!["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(booking.status)) {
    return NextResponse.json({ error: "Booking ini tidak dapat dilunasi." }, { status: 400 });
  }

  // langkah 2 & 4: sisa tagihan dan validasi nominal
  const sisa = booking.totalHarga - totalDibayar(booking.pembayaran);
  if (Number(nominal) !== sisa) {
    return NextResponse.json(
      { error: `Nominal tidak sesuai sisa tagihan (Rp${sisa.toLocaleString("id-ID")}).` },
      { status: 400 }
    );
  }

  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const hariIni = tanggalWibCompact();
      const urut = (await tx.nota.count({ where: { noNota: { startsWith: `NT-${hariIni}-` } } })) + 1;
      await tx.pembayaran.create({
        data: {
          bookingId: booking.id,
          jenis: "PELUNASAN",
          nominal: sisa,
          metode: metode || "Tunai",
          dicatatOlehId: session.id,
        },
      });
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "LUNAS",
          nota: { create: { noNota: `NT-${hariIni}-${String(urut).padStart(4, "0")}` } },
        },
        include: { nota: true, pembayaran: true, lapangan: true },
      });
    });
    return NextResponse.json(hasil);
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Nomor nota bentrok. Silakan ulangi." }, { status: 409 });
    }
    throw err;
  }
}
