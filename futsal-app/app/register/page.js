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
    <div className="max-w-sm mx-auto card">
      <h1 className="text-xl font-bold mb-4">Daftar Akun Penyewa</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">Nama Lengkap</label>
          <input className="input" value={form.nama} onChange={update("nama")} required />
        </div>
        <div>
          <label className="text-sm text-gray-600">Nomor HP</label>
          <input
            className="input"
            value={form.noHp}
            onChange={update("noHp")}
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Email (opsional)</label>
          <input className="input" type="email" value={form.email} onChange={update("email")} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={update("password")}
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-lapangan-600 font-medium">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
