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

  const rp = (n) => "Rp" + n.toLocaleString("id-ID");
  const jamStr = (j) => String(j).padStart(2, "0") + ".00";
  const dalamRentang = (jam) => jamMulai !== null && jam >= jamMulai && jam < jamMulai + jumlahJam;

  return (
    <div>
      <h1 className="judul-halaman mb-6">Booking lapangan</h1>

      {sukses && (
        <div className="card mb-6 !border-emerald-400/50 bg-emerald-400/5">
          <p className="font-display text-2xl font-semibold text-emerald-300">
            Booking dibuat, slot sudah dikunci untuk Anda.
          </p>
          <p className="text-sm text-garis/85 mt-2 max-w-2xl">
            Status: <strong>Menunggu Pembayaran</strong>. Bayar DP {rp(sukses.dpHarusDibayar ?? 0)} ke Kasir (transfer
            atau di lokasi) paling lambat {BATAS_DP_JAM} jam dari sekarang. Setelah Kasir mengonfirmasi, status berubah
            menjadi Terkonfirmasi. Jika DP tidak dibayar dalam batas waktu, booking dibatalkan otomatis dan slot
            dilepas.
          </p>
          <button className="btn-outline btn-kecil mt-4" onClick={() => router.push("/riwayat")}>
            Lihat riwayat booking
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="card space-y-6">
          <div>
            <p className="label">Lapangan</p>
            <div className="grid sm:grid-cols-3 gap-2">
              {lapanganList.map((l) => {
                const dipilih = l.id === lapanganId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={dipilih}
                    onClick={() => setLapanganId(l.id)}
                    className={`text-left rounded-xl border px-3.5 py-3 transition-colors ${
                      dipilih ? "border-bola bg-bola/10" : "border-garis/20 hover:border-garis/50"
                    }`}
                  >
                    <span className="block font-semibold leading-tight">{l.nama}</span>
                    <span className="block text-sm text-redup mt-1">{rp(l.hargaPerJam)} /jam</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="tanggal">Tanggal</label>
              <input
                id="tanggal"
                type="date"
                className="input"
                value={tanggal}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>
            <div>
              <p className="label">Durasi</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={jumlahJam === n}
                    onClick={() => setJumlahJam(n)}
                    className={`rounded-xl border py-2.5 font-medium transition-colors ${
                      jumlahJam === n ? "border-bola bg-bola/10" : "border-garis/20 hover:border-garis/50"
                    }`}
                  >
                    {n} jam
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="label !mb-0">Jam mulai</p>
              <p className="flex items-center gap-4 text-xs text-redup">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border border-garis/40" /> Kosong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rompi-500" /> Pilihan Anda
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border border-garis/15 slot-terisi" /> Tidak tersedia
                </span>
              </p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {JAM_OPERASIONAL.map((jam) => {
                const bentrok = slotBentrok(jam);
                const aktif = dalamRentang(jam);
                return (
                  <button
                    key={jam}
                    type="button"
                    disabled={bentrok && !aktif}
                    aria-pressed={jamMulai === jam}
                    onClick={() => !bentrok && setJamMulai(jam)}
                    className={`angka text-lg py-2.5 rounded-xl border transition-colors ${
                      aktif
                        ? "bg-rompi-500 text-pitch-950 border-rompi-500"
                        : bentrok
                        ? "slot-terisi text-garis/30 border-garis/10 cursor-not-allowed"
                        : "border-garis/25 hover:border-bola hover:text-bola"
                    }`}
                  >
                    {jamStr(jam)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="card lg:sticky lg:top-24 !bg-pitch-700">
          <h2 className="font-display text-2xl font-semibold">Ringkasan</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-redup">Lapangan</dt>
              <dd className="text-right font-medium">{lapanganTerpilih?.nama ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-redup">Tanggal</dt>
              <dd className="font-medium">{tanggal}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-redup">Jam</dt>
              <dd className="font-medium">
                {jamMulai === null ? "Belum dipilih" : `${jamStr(jamMulai)} sampai ${jamStr(jamMulai + jumlahJam)}`}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-garis/15 pt-3">
              <dt className="text-redup">Total biaya</dt>
              <dd className="font-semibold">{rp(totalHarga)}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-xl bg-pitch-950/60 px-4 py-3">
            <p className="text-sm text-redup">DP yang harus dibayar ({dpPersen}%)</p>
            <p className="angka text-4xl text-bola leading-tight">{rp(dpMinimal)}</p>
          </div>

          {error && <p className="pesan-galat mt-4">{error}</p>}

          <button className="btn-primary w-full mt-4" onClick={handleBooking} disabled={loading || jamMulai === null}>
            {loading ? "Memproses..." : "Buat Booking"}
          </button>
          <p className="text-xs text-redup mt-3">
            DP dibayar ke Kasir paling lambat {BATAS_DP_JAM} jam setelah booking dibuat.
          </p>
        </aside>
      </div>
    </div>
  );
}
