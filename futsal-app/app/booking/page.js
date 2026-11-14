"use client";

import { BATAS_DP_JAM } from "@/lib/konstanta";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const JAM_OPERASIONAL = Array.from({ length: 16 }, (_, i) => i + 8); // 08:00 - 23:00

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingForm />
    </Suspense>
  );
}

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lapanganList, setLapanganList] = useState([]);
  const [lapanganId, setLapanganId] = useState(searchParams.get("lapanganId") || "");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [jamTerisi, setJamTerisi] = useState([]);
  const [jamMulai, setJamMulai] = useState(null);
  const [jumlahJam, setJumlahJam] = useState(1);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dpPersen, setDpPersen] = useState(50); // aturan Owner (tabel Pengaturan)

  useEffect(() => {
    fetch("/api/lapangan")
      .then((r) => r.json())
      .then((data) => {
        setLapanganList(data);
        if (!lapanganId && data.length > 0) setLapanganId(data[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lapanganId || !tanggal) return;
    fetch(`/api/ketersediaan?lapanganId=${lapanganId}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => setJamTerisi(d.jamTerisi || []));
    setJamMulai(null);
  }, [lapanganId, tanggal]);

  const lapanganTerpilih = lapanganList.find((l) => l.id === lapanganId);

  useEffect(() => {
    fetch("/api/pengaturan").then((r) => r.json()).then((d) => d.dpPersen && setDpPersen(d.dpPersen)).catch(() => {});
  }, []);

  const totalHarga = useMemo(() => {
    if (!lapanganTerpilih) return 0;
    return lapanganTerpilih.hargaPerJam * jumlahJam;
  }, [lapanganTerpilih, jumlahJam]);

  const dpMinimal = Math.ceil((totalHarga * dpPersen) / 100);

  function slotBentrok(jam) {
    for (let i = 0; i < jumlahJam; i++) {
      if (jamTerisi.includes(jam + i)) return true;
    }
    return jam + jumlahJam > 24;
  }

  async function handleBooking() {
    setError("");
    setSukses(null);
    if (jamMulai === null) {
      setError("Silakan pilih jam mulai terlebih dahulu.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lapanganId, tanggal, jamMulai, jumlahJam }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Gagal membuat booking.");
      // refresh ketersediaan karena kemungkinan slot baru saja terisi (FR-15)
      fetch(`/api/ketersediaan?lapanganId=${lapanganId}&tanggal=${tanggal}`)
        .then((r) => r.json())
        .then((d) => setJamTerisi(d.jamTerisi || []));
      return;
    }
    setSukses(data);
    setJamTerisi((prev) => [...prev, ...Array.from({ length: jumlahJam }, (_, i) => jamMulai + i)]);
    setJamMulai(null);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Booking Lapangan</h1>

      {sukses && (
        <div className="card mb-4 border-lapangan-500">
          <p className="font-semibold text-lapangan-700">Booking dibuat, slot sudah dikunci untuk Anda.</p>
          <p className="text-sm text-gray-600 mt-1">
            Status: <strong>Menunggu Pembayaran</strong>. Bayar DP Rp
            {(sukses.dpHarusDibayar ?? 0).toLocaleString("id-ID")} ke Kasir (transfer atau di lokasi) paling lambat{" "}
            {BATAS_DP_JAM} jam dari sekarang. Setelah Kasir mengonfirmasi, status berubah menjadi Terkonfirmasi.
            Jika DP tidak dibayar dalam batas waktu, booking dibatalkan otomatis dan slot dilepas.
          </p>
          <button className="btn-outline mt-3 text-sm" onClick={() => router.push("/riwayat")}>
            Lihat Riwayat Booking
          </button>
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <label className="text-sm text-gray-600">Pilih Lapangan</label>
          <select className="input" value={lapanganId} onChange={(e) => setLapanganId(e.target.value)}>
            {lapanganList.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama} — Rp{l.hargaPerJam.toLocaleString("id-ID")}/jam
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Tanggal</label>
          <input
            type="date"
            className="input"
            value={tanggal}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Durasi (jam)</label>
          <select className="input" value={jumlahJam} onChange={(e) => setJumlahJam(Number(e.target.value))}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} jam
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-2">
            Pilih Jam Mulai (bentuk terisi = sudah dibooking)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {JAM_OPERASIONAL.map((jam) => {
              const bentrok = slotBentrok(jam);
              const aktif = jamMulai === jam;
              return (
                <button
                  key={jam}
                  type="button"
                  disabled={bentrok}
                  onClick={() => setJamMulai(jam)}
                  className={`text-sm py-2 rounded-lg border ${
                    bentrok
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                      : aktif
                      ? "bg-lapangan-600 text-white border-lapangan-600"
                      : "border-gray-300 hover:border-lapangan-500"
                  }`}
                >
                  {String(jam).padStart(2, "0")}:00
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between text-sm border-t pt-3">
          <span className="text-gray-500">Total Biaya</span>
          <span className="font-semibold">Rp{totalHarga.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">DP yang harus dibayar ({dpPersen}%)</span>
          <span className="font-semibold text-lapangan-700">
            Rp{dpMinimal.toLocaleString("id-ID")}
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={handleBooking} disabled={loading || jamMulai === null}>
          {loading ? "Memproses..." : "Buat Booking"}
        </button>
      </div>
    </div>
  );
}
