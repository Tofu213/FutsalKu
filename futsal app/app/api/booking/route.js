import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { ambilPengaturan, daftarJam, jamValid, kedaluwarsakanBooking, TANGGAL_RE } from "@/lib/util";
import { dpDiperlukan, sudahLewat } from "@/lib/konstanta";

// Riwayat booking milik pelanggan; Owner/Kasir melihat semua transaksi
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  await kedaluwarsakanBooking();
  const bookings = await prisma.booking.findMany({
    where: requireRole(session, ["OWNER", "KASIR"]) ? {} : { userId: session.id },
    include: {
      lapangan: true,
      user: { select: { nama: true, noHp: true } },
      pembayaran: { orderBy: { waktu: "asc" } },
      nota: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

// UC-03 Booking Lapangan (pelanggan, online): booking dibuat berstatus Menunggu Pembayaran dan
// slot langsung dikunci; DP dikonfirmasi Kasir/Owner (PATCH action "konfirmasi_dp") paling lambat
// BATAS_DP_JAM jam, jika tidak booking dibatalkan otomatis dan slot dilepas. Dan
// UC-05 langkah 1 (kasir membuat booking walk-in setelah memeriksa ketersediaan).
// Pencegahan double booking: pengecekan di aplikasi + unique (lapanganId, tanggal, jam)
// pada tabel SlotBooking sebagai pengaman di level basis data.
export async function POST(req) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = await req.json();
  const { lapanganId, tanggal, namaTamu, noHpTamu } = body;
  const jamMulai = Number(body.jamMulai);
  const jumlahJam = Number(body.jumlahJam);

  if (!lapanganId || !tanggal || body.jamMulai === undefined || !body.jumlahJam) {
    return NextResponse.json(
      { error: "Lapangan, tanggal, jam mulai, dan jumlah jam wajib diisi." },
      { status: 400 }
    );
  }
  if (!TANGGAL_RE.test(tanggal) || !jamValid(jamMulai, jumlahJam)) {
    return NextResponse.json({ error: "Tanggal atau jam tidak valid." }, { status: 400 });
  }

  if (sudahLewat(tanggal, jamMulai)) {
    return NextResponse.json({ error: "Tidak dapat memesan jam yang sudah lewat." }, { status: 400 });
  }
  await kedaluwarsakanBooking();
  const petugas = requireRole(session, ["OWNER", "KASIR"]);
  const walkIn = petugas; // petugas yang membuat booking = walk-in (UC-05)
  if (walkIn && !namaTamu) {
    return NextResponse.json({ error: "Nama tamu wajib diisi untuk booking walk-in." }, { status: 400 });
  }

  const lapangan = await prisma.lapangan.findUnique({ where: { id: lapanganId } });
  if (!lapangan || !lapangan.aktif) {
    return NextResponse.json({ error: "Lapangan tidak ditemukan atau tidak aktif." }, { status: 404 });
  }

  const jam = daftarJam(jamMulai, jumlahJam);

  // Slot diblokir Owner (UC-06)
  const diblokir = await prisma.jadwalBlokir.findFirst({
    where: { lapanganId, tanggal, jam: { in: jam } },
  });
  if (diblokir) {
    return NextResponse.json({ error: "Slot jadwal yang dipilih sedang ditutup." }, { status: 409 });
  }

  // Slot sudah dipesan (A2)
  const terisi = await prisma.slotBooking.findFirst({
    where: { lapanganId, tanggal, jam: { in: jam } },
  });
  if (terisi) {
    return NextResponse.json(
      { error: "Slot jadwal yang dipilih sudah dipesan. Silakan pilih jam lain." },
      { status: 409 }
    );
  }

  const pengaturan = await ambilPengaturan();
  const totalHarga = lapangan.hargaPerJam * jumlahJam;
  const dpHarusDibayar = dpDiperlukan(totalHarga, pengaturan.dpPersen);

  try {
    const booking = await prisma.booking.create({
      data: {
        lapanganId,
        userId: walkIn ? null : session.id,
        namaTamu: walkIn ? namaTamu : null,
        noHpTamu: walkIn ? noHpTamu || null : null,
        asal: walkIn ? "WALK_IN" : "ONLINE",
        tanggal,
        jamMulai,
        jumlahJam,
        totalHarga,
        dpDibayar: 0,
        status: walkIn ? "TERKONFIRMASI" : "MENUNGGU_PEMBAYARAN",
        slots: { create: jam.map((j) => ({ lapanganId, tanggal, jam: j })) },
      },
      include: { lapangan: true, pembayaran: true },
    });
    return NextResponse.json({ ...booking, dpHarusDibayar }, { status: 201 });
  } catch (err) {
    // A3: dua request lolos pengecekan bersamaan; unique SlotBooking menolak yang kedua
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Slot jadwal yang dipilih baru saja dipesan pengguna lain." },
        { status: 409 }
      );
    }
    throw err;
  }
}
