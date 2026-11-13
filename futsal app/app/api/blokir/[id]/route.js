import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";

// Buka kembali slot yang diblokir (Owner)
export async function DELETE(_req, { params }) {
  const session = getSession();
  if (!requireRole(session, ["OWNER"])) {
    return NextResponse.json({ error: "Hanya Owner." }, { status: 403 });
  }
  await prisma.jadwalBlokir.deleteMany({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
