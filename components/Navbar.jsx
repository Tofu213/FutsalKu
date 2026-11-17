"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .finally(() => setLoading(false));
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const tautan = (href, teks) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full transition-colors ${
        pathname === href ? "bg-garis/10 text-garis" : "text-redup hover:text-garis"
      }`}
    >
      {teks}
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-garis/10 bg-pitch-900/85 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-rompi-500" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          FutsalKu
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {tautan("/", "Beranda")}
          {!loading && user?.role === "PELANGGAN" && tautan("/booking", "Booking")}
          {!loading && user?.role === "PELANGGAN" && tautan("/riwayat", "Riwayat")}
          {!loading && user && ["OWNER", "KASIR"].includes(user.role) && tautan("/admin", "Dashboard")}

          {!loading && !user && (
            <span className="flex items-center gap-2 ml-2">
              <Link href="/login" className="btn-outline !py-1.5 !px-4">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary !py-1.5 !px-4">
                Daftar
              </Link>
            </span>
          )}

          {!loading && user && (
            <span className="flex items-center gap-3 ml-2">
              <span className="text-redup">Hai, {user.nama}</span>
              <button onClick={handleLogout} className="btn-outline !py-1.5 !px-4">
                Keluar
              </button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
