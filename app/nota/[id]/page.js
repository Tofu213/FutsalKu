"use client";

// UC-05: tampilan nota digital (dapat dicetak)
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

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

  if (error) return <p className="pesan-galat max-w-md mx-auto">{error}</p>;
  if (!b) return <p className="text-redup">Memuat nota...</p>;
  if (!b.nota)
    return (
      <p className="pesan-info max-w-md mx-auto">Nota belum terbit. Nota terbit setelah pelunasan dicatat.</p>
    );

  const total = b.pembayaran.reduce((s, p) => s + p.nominal, 0);
  const nama = b.user?.nama ?? `${b.namaTamu} (walk-in)`;
  const baris = "flex justify-between gap-4";

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 text-sm shadow-2xl shadow-black/30 print:shadow-none print:p-0">
        <div className="flex items-start justify-between gap-4 border-b-2 border-dashed border-gray-300 pb-4">
          <div>
            <p className="font-display text-3xl font-bold leading-none">FutsalKu</p>
            <h1 className="font-sans text-sm text-gray-500 mt-1">Nota sewa lapangan futsal</h1>
          </div>
          <span className="font-display text-xl font-bold border-2 border-emerald-600 text-emerald-700 rounded-md px-2.5 py-0.5 -rotate-3">
            LUNAS
          </span>
        </div>

        <dl className="py-4 space-y-1.5 border-b border-gray-200">
          <div className={baris}><dt className="text-gray-500">No. nota</dt><dd className="font-semibold">{b.nota.noNota}</dd></div>
          <div className={baris}>
            <dt className="text-gray-500">Terbit</dt>
            <dd>{new Date(b.nota.tanggalTerbit).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</dd>
          </div>
          <div className={baris}><dt className="text-gray-500">Pelanggan</dt><dd className="font-semibold">{nama}</dd></div>
          <div className={baris}><dt className="text-gray-500">Lapangan</dt><dd>{b.lapangan.nama}</dd></div>
          <div className={baris}><dt className="text-gray-500">Tanggal</dt><dd>{b.tanggal}</dd></div>
          <div className={baris}>
            <dt className="text-gray-500">Jam</dt>
            <dd>{jamStr(b.jamMulai)} - {jamStr(b.jamMulai + b.jumlahJam)} ({b.jumlahJam} jam)</dd>
          </div>
        </dl>

        <div className="py-4 space-y-1.5">
          <div className={baris}><span>Total biaya</span><strong>{rp(b.totalHarga)}</strong></div>
          {b.pembayaran.map((p) => (
            <div key={p.id} className={`${baris} text-gray-600`}>
              <span>{p.jenis === "DP" ? "DP" : "Pelunasan"} ({p.metode})</span>
              <span>{rp(p.nominal)}</span>
            </div>
          ))}
          <div className={`${baris} border-t border-gray-200 pt-2 items-baseline`}>
            <span>Total dibayar</span>
            <strong className="font-display text-2xl">{rp(total)}</strong>
          </div>
          <div className={baris}><span>Sisa</span><strong>{rp(b.totalHarga - total)}</strong></div>
        </div>
        <p className="text-center text-xs text-gray-500 border-t-2 border-dashed border-gray-300 pt-4">
          Terima kasih sudah bermain di FutsalKu.
        </p>
      </div>
      <button className="btn-outline w-full mt-5 print:hidden" onClick={() => window.print()}>
        <Printer className="w-4 h-4 mr-2" aria-hidden="true" />
        Cetak nota
      </button>
    </div>
  );
}
