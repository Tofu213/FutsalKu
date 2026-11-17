import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-jangan-dipakai-di-produksi"
);

const RUTE_TERPROTEKSI = ["/booking", "/riwayat", "/admin", "/nota"];
const RUTE_KHUSUS_PETUGAS = ["/admin"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const butuhLogin = RUTE_TERPROTEKSI.some((r) => pathname.startsWith(r));
  if (!butuhLogin) return NextResponse.next();

  const token = req.cookies.get("futsal_session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const butuhPetugas = RUTE_KHUSUS_PETUGAS.some((r) => pathname.startsWith(r));
    if (butuhPetugas && !["OWNER", "KASIR"].includes(payload.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/booking/:path*", "/riwayat/:path*", "/admin/:path*"],
};
