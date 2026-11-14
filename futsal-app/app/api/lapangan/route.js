import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";

// FR-03: menampilkan daftar lapangan yang tersedia
export async function GET() {
  const lapangan = await prisma.lapangan.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });
  return NextResponse.json(lapangan);
}

// FR-11: Owner mengatur lapangan baru & harga per jam
export async function POST(req) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner yang dapat menambah lapangan." }, { status: 403 });
  }

  const { nama, jenis, hargaPerJam } = await req.json();
  if (!nama || !jenis || !hargaPerJam) {
    return NextResponse.json({ error: "Nama, jenis, dan harga per jam wajib diisi." }, { status: 400 });
  }

  const lapangan = await prisma.lapangan.create({
    data: { nama, jenis, hargaPerJam: Number(hargaPerJam) },
  });
  return NextResponse.json(lapangan, { status: 201 });
}
