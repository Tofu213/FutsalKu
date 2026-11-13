import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";

// UC-06 Kelola Lapangan dan Harga: ubah data/harga/status aktif (Owner).
// Booking lama tidak berubah karena totalHarga disimpan pada booking.
export async function PATCH(req, { params }) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner yang dapat mengubah lapangan." }, { status: 403 });
  }
  const body = await req.json();
  const data = {};
  if (body.nama !== undefined) data.nama = String(body.nama).trim();
  if (body.jenis !== undefined) data.jenis = String(body.jenis);
  if (body.aktif !== undefined) data.aktif = Boolean(body.aktif);
  if (body.hargaPerJam !== undefined) {
    const h = Number(body.hargaPerJam);
    if (!Number.isInteger(h) || h <= 0) {
      return NextResponse.json({ error: "Harga per jam tidak valid." }, { status: 400 });
    }
    data.hargaPerJam = h;
  }
  if (data.nama === "") {
    return NextResponse.json({ error: "Nama tidak boleh kosong." }, { status: 400 });
  }
  const updated = await prisma.lapangan.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
