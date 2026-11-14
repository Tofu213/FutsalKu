import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { ambilPengaturan, kedaluwarsakanBooking } from "@/lib/util";
import { dpDiperlukan, sudahMulai } from "@/lib/konstanta";

// Detail booking (dasar tampilan nota); hanya pemilik atau petugas
export async function GET(req, { params }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }
  await kedaluwarsakanBooking();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      lapangan: true,
      user: { select: { nama: true, noHp: true } },
      pembayaran: { orderBy: { waktu: "asc" } },
      nota: true,
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
  }
  if (booking.userId !== session.id && !requireRole(session, ["OWNER", "KASIR"])) {
    return NextResponse.json({ error: "Anda tidak berhak melihat booking ini." }, { status: 403 });
  }
  return NextResponse.json(booking);
}

// UC-04 Batalkan Booking, dan penandaan selesai oleh petugas.
// Pelunasan ada di /api/booking/[id]/pelunasan (UC-05).
export async function PATCH(req, { params }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { action, metode } = await req.json();
  await kedaluwarsakanBooking();
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
  }

  const isPemilik = booking.userId === session.id;
  const isPetugas = requireRole(session, ["OWNER", "KASIR"]);

  if (action === "batal") {
    if (!isPemilik && !isPetugas) {
      return NextResponse.json({ error: "Anda tidak berhak membatalkan booking ini." }, { status: 403 });
    }
    // A1: hanya Menunggu Pembayaran / Terkonfirmasi yang dapat dibatalkan
    if (!["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Booking dengan status ini tidak dapat dibatalkan." },
        { status: 400 }
      );
    }

    if (sudahMulai(booking.tanggal, booking.jamMulai)) {
      return NextResponse.json({ error: "Permainan sudah dimulai, booking tidak dapat dibatalkan." }, { status: 400 });
    }
    const pengaturan = await ambilPengaturan();
    const [, updated] = await prisma.$transaction([
      // langkah 6: lepaskan slot jadwal
      prisma.slotBooking.deleteMany({ where: { bookingId: booking.id } }),
      // langkah 5: ubah status; perlakuan DP mengikuti aturan Owner
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "DIBATALKAN",
          dibatalkanAt: new Date(),
          perlakuanDp: booking.dpDibayar > 0 ? pengaturan.perlakuanDpBatal : null,
        },
      }),
    ]);
    return NextResponse.json(updated);
  }

  // UC-03 (lanjutan): Kasir/Owner mengonfirmasi DP yang sudah diterima dari pelanggan
  if (action === "konfirmasi_dp") {
    if (!isPetugas) {
      return NextResponse.json({ error: "Hanya Kasir/Owner yang dapat mengonfirmasi DP." }, { status: 403 });
    }
    if (booking.status !== "MENUNGGU_PEMBAYARAN") {
      return NextResponse.json(
        { error: "Hanya booking berstatus Menunggu Pembayaran yang dapat dikonfirmasi DP-nya." },
        { status: 400 }
      );
    }
    const pengaturan = await ambilPengaturan();
    const dp = dpDiperlukan(booking.totalHarga, pengaturan.dpPersen);
    const [, updated] = await prisma.$transaction([
      prisma.pembayaran.create({
        data: { bookingId: booking.id, jenis: "DP", nominal: dp, metode: metode || "Transfer", dicatatOlehId: session.id },
      }),
      prisma.booking.update({ where: { id: booking.id }, data: { status: "TERKONFIRMASI", dpDibayar: dp } }),
    ]);
    return NextResponse.json(updated);
  }

  if (action === "selesai") {
    if (!isPetugas) {
      return NextResponse.json({ error: "Hanya Kasir/Owner yang dapat menandai selesai." }, { status: 403 });
    }
    if (booking.status !== "LUNAS") {
      return NextResponse.json({ error: "Hanya booking Lunas yang dapat ditandai selesai." }, { status: 400 });
    }
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "SELESAI" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
