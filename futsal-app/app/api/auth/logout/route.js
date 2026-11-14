import { NextResponse } from "next/server";
import { hapusSessionCookie } from "@/lib/auth";

export async function POST() {
  hapusSessionCookie();
  return NextResponse.json({ ok: true });
}
