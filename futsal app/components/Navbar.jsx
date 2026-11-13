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

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-lapangan-700">
          ⚽ FutsalKu
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-lapangan-600">
            Beranda
          </Link>
          {!loading && user?.role === "PELANGGAN" && (
            <Link href="/booking" className="hover:text-lapangan-600">
              Booking
            </Link>
          )}
          {!loading && user?.role === "PELANGGAN" && (
            <Link href="/riwayat" className="hover:text-lapangan-600">
              Riwayat
            </Link>
          )}
          {!loading && user && ["OWNER", "KASIR"].includes(user.role) && (
            <Link href="/admin" className="hover:text-lapangan-600">
              Dashboard
            </Link>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" className="btn-outline !py-1.5">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary !py-1.5">
                Daftar
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500">Hai, {user.nama}</span>
              <button onClick={handleLogout} className="btn-outline !py-1.5">
                Keluar
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
