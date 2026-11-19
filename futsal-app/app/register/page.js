"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ nama: "", noHp: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Gagal mendaftar.");
      return;
    }
    router.push("/booking");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="judul-halaman mb-2">Daftar akun</h1>
      <p className="text-redup mb-6">Satu akun untuk booking, melihat riwayat, dan mengambil nota.</p>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="nama">Nama lengkap</label>
            <input id="nama" className="input" value={form.nama} onChange={update("nama")} required />
          </div>
          <div>
            <label className="label" htmlFor="noHp">Nomor HP</label>
            <input
              id="noHp"
              className="input"
              inputMode="tel"
              value={form.noHp}
              onChange={update("noHp")}
              placeholder="08xxxxxxxxxx"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email (opsional)</label>
            <input id="email" className="input" type="email" value={form.email} onChange={update("email")} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password (minimal 6 karakter)</label>
            <input
              id="password"
              className="input"
              type="password"
              value={form.password}
              onChange={update("password")}
              minLength={6}
              required
            />
          </div>
          {error && <p className="pesan-galat">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>
      </div>
      <p className="text-sm text-redup mt-5">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-rompi-400 font-semibold hover:text-rompi-300">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
