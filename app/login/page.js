"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [noHp, setNoHp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noHp, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Gagal masuk.");
      return;
    }
    const redirect = searchParams.get("redirect") || "/";
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="judul-halaman mb-2">Masuk</h1>
      <p className="text-redup mb-6">Masuk untuk melihat jadwal dan membuat booking.</p>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="noHp">Nomor HP</label>
            <input
              id="noHp"
              className="input"
              inputMode="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="pesan-galat">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
      <p className="text-sm text-redup mt-5">
        Belum punya akun?{" "}
        <Link href="/register" className="text-rompi-400 font-semibold hover:text-rompi-300">
          Daftar di sini
        </Link>
      </p>
      <p className="text-xs text-redup/70 mt-3">
        Akun demo Owner: <code>081200000001</code> / password <code>owner123</code> (dibuat lewat{" "}
        <code>npm run seed</code>)
      </p>
    </div>
  );
}
