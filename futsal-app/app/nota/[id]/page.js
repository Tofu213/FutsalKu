"use client";

// UC-05: tampilan nota digital (dapat dicetak)
import { useEffect, useState } from "react";

const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const jamStr = (j) => String(j).padStart(2, "0") + ":00";

export default function NotaPage({ params }) {
  const [b, setB] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/booking/${params.id}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => (ok ? setB(d) : setError(d.error || "Gagal memuat nota.")));
  }, [params.id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!b) return <p className="text-gray-500">Memuat nota...</p>;
  if (!b.nota) return <p className="text-gray-600">Nota belum terbit. Nota terbit setelah pelunasan dicatat.</p>;

  const total = b.pembayaran.reduce((s, p) => s + p.nominal, 0);
  const nama = b.user?.nama ?? `${b.namaTamu} (walk-in)`;

  return (
    <div className="max-w-md mx-auto card space-y-3 text-sm">
      <div className="text-center">
        <h1 className="text-lg font-bold">NOTA SEWA LAPANGAN FUTSAL</h1>
        <p className="text-gray-500">{b.nota.noNota}</p>
        <p className="text-gray-500">
          Terbit: {new Date(b.nota.tanggalTerbit).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
        </p>
      </div>
      <div className="border-t pt-3 space-y-1">
        <p>Pelanggan: <strong>{nama}</strong></p>
        <p>Lapangan: {b.lapangan.nama}</p>
        <p>Tanggal: {b.tanggal}</p>
        <p>Jam: {jamStr(b.jamMulai)} - {jamStr(b.jamMulai + b.jumlahJam)} ({b.jumlahJam} jam)</p>
      </div>
      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between"><span>Total biaya</span><strong>{rp(b.totalHarga)}</strong></div>
        {b.pembayaran.map((p) => (
          <div key={p.id} className="flex justify-between text-gray-600">
            <span>{p.jenis === "DP" ? "DP" : "Pelunasan"} ({p.metode})</span>
            <span>{rp(p.nominal)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-1"><span>Total dibayar</span><strong>{rp(total)}</strong></div>
        <div className="flex justify-between"><span>Sisa</span><strong>{rp(b.totalHarga - total)}</strong></div>
        <p className="text-center font-semibold text-green-700 pt-1">LUNAS</p>
      </div>
      <button className="btn-outline w-full print:hidden" onClick={() => window.print()}>Cetak nota</button>
    </div>
  );
}
