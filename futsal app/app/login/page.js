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
    <div className="max-w-sm mx-auto card">
      <h1 className="text-xl font-bold mb-4">Masuk</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">Nomor HP</label>
          <input
            className="input"
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Belum punya akun?{" "}
        <Link href="/register" className="text-lapangan-600 font-medium">
          Daftar di sini
        </Link>
      </p>
      <p className="text-xs text-gray-400 mt-3">
        Akun demo Owner: <code>081200000001</code> / password{" "}
        <code>owner123</code> (dibuat lewat{" "}
        <code>npm run seed</code>)
      </p>
    </div>
  );
}
