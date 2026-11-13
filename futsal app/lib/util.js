import { prisma } from "./prisma";
import { BATAS_DP_JAM } from "./konstanta";

export const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;

// Aturan bisnis yang ditetapkan Owner (tabel Pengaturan, satu baris id=1)
export async function ambilPengaturan() {
  const p = await prisma.pengaturan.findUnique({ where: { id: 1 } });
  return p || { id: 1, dpPersen: 50, perlakuanDpBatal: "HANGUS" };
}

// Daftar jam yang dicakup booking/blokir: [jamMulai, jamMulai+1, ...]
export function daftarJam(jamMulai, jumlahJam) {
  return Array.from({ length: jumlahJam }, (_, i) => jamMulai + i);
}

// Validasi jam mulai & durasi (0-23 dan tidak melewati tengah malam)
export function jamValid(jamMulai, jumlahJam) {
  return (
    Number.isInteger(jamMulai) &&
    Number.isInteger(jumlahJam) &&
    jamMulai >= 0 &&
    jumlahJam >= 1 &&
    jamMulai + jumlahJam <= 24
  );
}

// Tanggal hari ini (WIB, UTC+7) sebagai YYYYMMDD untuk nomor nota
export function tanggalWibCompact(d = new Date()) {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10).replace(/-/g, "");
}

// Booking yang tidak dibayar DP-nya dalam BATAS_DP_JAM dibatalkan otomatis dan slotnya dilepas.
// Dipanggil secara "lazy" setiap kali jadwal atau booking dibaca/dibuat.
export async function kedaluwarsakanBooking() {
  const batas = new Date(Date.now() - BATAS_DP_JAM * 3600 * 1000);
  const ids = (
    await prisma.booking.findMany({
      where: { status: "MENUNGGU_PEMBAYARAN", createdAt: { lt: batas } },
      select: { id: true },
    })
  ).map((b) => b.id);
  if (ids.length === 0) return 0;
  await prisma.$transaction([
    prisma.slotBooking.deleteMany({ where: { bookingId: { in: ids } } }),
    prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: { status: "DIBATALKAN", dibatalkanAt: new Date(), catatan: "Kedaluwarsa: DP tidak dibayar dalam batas waktu" },
    }),
  ]);
  return ids.length;
}

export function totalDibayar(pembayaran) {
  return pembayaran.reduce((s, p) => s + p.nominal, 0);
}
