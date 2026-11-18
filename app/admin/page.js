"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Ban, BadgeCheck, Banknote, CalendarX, Flag, Footprints, Plus, Receipt, Save, Settings2,
  TrendingUp, Undo2, Unlock, Wallet,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import GrafikPendapatan from "@/components/GrafikPendapatan";
import { useUmpan } from "@/components/Umpan";


const rp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
const hariIni = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const jamStr = (j) => String(j).padStart(2, "0") + ":00";
const post = (url, body, method = "POST") =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function AdminPage() {
  const [me, setMe] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [lapanganList, setLapanganList] = useState([]);
  const [error, setError] = useState("");
  const { toast, konfirmasi } = useUmpan();

  function muatSemua() {
    fetch("/api/booking")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setBookings(d) : setError(d.error)));
    fetch("/api/lapangan").then((r) => r.json()).then(setLapanganList);
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    muatSemua();
  }, []);

  const isOwner = me?.role === "OWNER";

  async function aksi(res, sukses) {
    const d = await res.json().catch(() => ({}));
    toast(res.ok ? sukses || "Berhasil." : d.error || "Gagal.", res.ok ? "sukses" : "galat");
    if (res.ok) muatSemua();
    return res.ok;
  }

  const ubahStatus = (id, action, sukses) =>
    post(`/api/booking/${id}`, { action }, "PATCH").then((r) => aksi(r, sukses));

  async function batalkan(b) {
    const ok = await konfirmasi({
      judul: "Batalkan booking ini?",
      isi: `${namaPelanggan(b)}, ${b.lapangan.nama}, ${b.tanggal} ${jamStr(b.jamMulai)}. Slot akan dilepas.`,
      tombol: "Ya, batalkan",
      batal: "Tidak jadi",
      bahaya: true,
    });
    if (ok) ubahStatus(b.id, "batal", "Booking dibatalkan.");
  }

  // UC-03 (lanjutan): konfirmasi DP yang diterima dari pelanggan
  async function konfirmasiDp(b) {
    const ok = await konfirmasi({
      judul: "DP sudah diterima?",
      isi: `${namaPelanggan(b)} untuk ${b.lapangan.nama}, ${b.tanggal} ${jamStr(b.jamMulai)}. Pastikan uang DP sudah masuk sebelum dikonfirmasi.`,
      tombol: "Konfirmasi DP",
    });
    if (!ok) return;
    post(`/api/booking/${b.id}`, { action: "konfirmasi_dp", metode: "Transfer" }, "PATCH").then((r) =>
      aksi(r, "DP dikonfirmasi. Booking berstatus Terkonfirmasi.")
    );
  }

  // UC-05: pelunasan = sisa tagihan (total - pembayaran tercatat), lalu nota terbit
  async function lunasi(b) {
    const sisa = b.totalHarga - b.pembayaran.reduce((s, p) => s + p.nominal, 0);
    const ok = await konfirmasi({
      judul: `Terima pelunasan ${rp(sisa)}?`,
      isi: `Sisa tagihan ${namaPelanggan(b)} dicatat sebagai pembayaran tunai, lalu nota diterbitkan.`,
      tombol: "Catat pelunasan",
    });
    if (!ok) return;
    post(`/api/booking/${b.id}/pelunasan`, { nominal: sisa, metode: "Tunai" }).then((r) =>
      aksi(r, "Pelunasan dicatat dan nota diterbitkan.")
    );
  }

  const namaPelanggan = (b) => b.user?.nama ?? `${b.namaTamu} (walk-in)`;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="judul-halaman">Dashboard {isOwner ? "Owner" : "Kasir"}</h1>
        {me && <p className="text-redup mt-2">Masuk sebagai {me.nama}</p>}
      </div>

      {isOwner && <LaporanPanel bookings={bookings} lapanganList={lapanganList} />}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <h2 className="judul-bagian">Semua transaksi</h2>
          {bookings && (
            <p className="text-sm text-redup">
              {bookings.filter((b) => b.status === "MENUNGGU_PEMBAYARAN").length} menunggu konfirmasi DP
            </p>
          )}
        </div>
        {error && <p className="pesan-galat">{error}</p>}
        {!bookings ? (
          <p className="text-redup text-sm">Memuat...</p>
        ) : bookings.length === 0 ? (
          <p className="card text-redup text-sm">Belum ada transaksi.</p>
        ) : (
          <div className="card !p-0 divide-y divide-garis/10">
            {bookings.map((b) => {
              return (
                <div key={b.id} className="px-5 py-4 flex justify-between items-center flex-wrap gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {namaPelanggan(b)}
                      {b.user?.noHp ? <span className="font-normal text-redup"> ({b.user.noHp})</span> : ""}
                    </p>
                    <p className="text-sm text-redup mt-0.5">
                      {b.lapangan.nama}, {b.tanggal}, {jamStr(b.jamMulai)} ({b.jumlahJam} jam)
                    </p>
                    {b.nota && (
                      <p className="text-xs text-redup mt-1">
                        Nota {b.nota.noNota}{" "}
                        <a href={`/nota/${b.id}`} className="inline-flex items-center gap-1 font-semibold text-rompi-400 hover:text-rompi-300"><Receipt className="w-3.5 h-3.5" aria-hidden="true" />Lihat nota</a>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="angka text-xl mr-1">{rp(b.totalHarga)}</span>
                    <StatusBadge status={b.status} />
                    {b.status === "MENUNGGU_PEMBAYARAN" && (
                      <button onClick={() => konfirmasiDp(b)} className="btn-primary btn-kecil gap-1.5">
                        <BadgeCheck className="w-4 h-4" aria-hidden="true" />
                        Konfirmasi DP
                      </button>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => lunasi(b)} className="btn-outline btn-kecil gap-1.5">
                        <Banknote className="w-4 h-4" aria-hidden="true" />
                        Catat Pelunasan
                      </button>
                    )}
                    {b.status === "LUNAS" && (
                      <button onClick={() => ubahStatus(b.id, "selesai", "Booking ditandai selesai.")} className="btn-outline btn-kecil gap-1.5">
                        <Flag className="w-4 h-4" aria-hidden="true" />
                        Tandai Selesai
                      </button>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => batalkan(b)} className="btn-bahaya">
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <WalkInPanel lapanganList={lapanganList} aksi={aksi} />

      {isOwner && (
        <>
          <LapanganPanel lapanganList={lapanganList} aksi={aksi} />
          <BlokirPanel lapanganList={lapanganList} aksi={aksi} />
          <PengaturanPanel aksi={aksi} />
        </>
      )}
    </div>
  );
}

// UC-07 Lihat Laporan Pendapatan
const OPERASIONAL_JAM = 16; // 08.00 sampai 24.00
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function LaporanPanel({ bookings, lapanganList }) {
  const [periode, setPeriode] = useState("harian");
  const [tanggal, setTanggal] = useState(hariIni());
  const [data, setData] = useState(null);
  const [bulanan, setBulanan] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    fetch(`/api/laporan?periode=${periode}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => (d.error ? (setErr(d.error), setData(null)) : setData(d)));
  }, [periode, tanggal]);

  // data bulan berjalan untuk grafik harian
  const bulanKey = tanggal.slice(0, 7);
  useEffect(() => {
    fetch(`/api/laporan?periode=bulanan&tanggal=${bulanKey}-01`)
      .then((r) => r.json())
      .then((d) => !d.error && setBulanan(d));
  }, [bulanKey]);

  const perHari = useMemo(() => {
    const [y, m] = bulanKey.split("-").map(Number);
    const jumlahHari = new Date(y, m, 0).getDate();
    const isi = Array.from({ length: jumlahHari }, (_, i) => {
      const t = `${bulanKey}-${String(i + 1).padStart(2, "0")}`;
      return { tanggal: t, hari: i + 1, label: `${i + 1} ${BULAN_PANJANG[m - 1]} ${y}`, nilai: 0, jumlah: 0 };
    });
    for (const t of bulanan?.transaksi ?? []) {
      const wib = new Date(new Date(t.waktu).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      const h = isi.find((d) => d.tanggal === wib);
      if (h) {
        h.nilai += t.nominal;
        h.jumlah += 1;
      }
    }
    return isi;
  }, [bulanan, bulanKey]);

  // okupansi: jam terpakai per lapangan pada tanggal terpilih (booking yang tidak dibatalkan)
  const okupansi = useMemo(
    () =>
      lapanganList.map((l) => {
        const jam = (bookings ?? [])
          .filter((b) => b.lapangan?.id === l.id && b.tanggal === tanggal && b.status !== "DIBATALKAN")
          .reduce((s, b) => s + b.jumlahJam, 0);
        return { nama: l.nama, jam, persen: Math.min(100, Math.round((jam / OPERASIONAL_JAM) * 100)) };
      }),
    [bookings, lapanganList, tanggal]
  );

  const totalBulan = perHari.reduce((s, d) => s + d.nilai, 0);
  const [yy, mm] = bulanKey.split("-").map(Number);

  const kartu = data && [
    { label: "DP diterima", nilai: data.dpDiterima, ikon: Wallet },
    { label: "Pelunasan", nilai: data.pelunasan, ikon: Banknote },
    { label: "DP dikembalikan", nilai: data.dpDikembalikan, ikon: Undo2 },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h2 className="judul-bagian">Laporan pendapatan</h2>
        <div className="flex items-center gap-2">
          <select className="input !w-auto" aria-label="Periode laporan" value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option value="harian">Harian</option>
            <option value="bulanan">Bulanan</option>
          </select>
          <input className="input !w-auto" aria-label="Tanggal laporan" type="date" value={tanggal} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
        </div>
      </div>
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kartu.map((k, i) => (
            <motion.div
              key={k.label}
              className="card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <p className="text-sm text-redup inline-flex items-center gap-1.5">
                <k.ikon className="w-4 h-4" aria-hidden="true" />
                {k.label}
              </p>
              <p className="angka text-3xl mt-1">{rp(k.nilai)}</p>
            </motion.div>
          ))}
          <motion.div
            className="card !bg-pitch-700 !border-bola/40"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-sm text-redup inline-flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              Pendapatan bersih
            </p>
            <p className="angka text-3xl mt-1 text-bola">{rp(data.pendapatanBersih)}</p>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-3">
        <div className="card min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h3 className="font-display text-xl font-semibold">
              Uang masuk per hari, {BULAN_PANJANG[mm - 1]} {yy}
            </h3>
            <p className="text-sm text-redup">
              Total <span className="font-semibold text-garis tabular-nums">{rp(totalBulan)}</span>
            </p>
          </div>
          <GrafikPendapatan
            data={perHari}
            terpilih={tanggal}
            onPilih={(t) => {
              setTanggal(t);
              setPeriode("harian");
            }}
          />
          <p className="text-xs text-redup mt-2">DP ditambah pelunasan. Klik batang untuk melihat laporan hari itu.</p>
        </div>
        <div className="card">
          <h3 className="font-display text-xl font-semibold">Okupansi {tanggal}</h3>
          <p className="text-xs text-redup mb-4">Jam terpesan dari {OPERASIONAL_JAM} jam operasional</p>
          <div className="space-y-4">
            {okupansi.map((o) => (
              <div key={o.nama}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{o.nama}</span>
                  <span className="tabular-nums text-redup shrink-0">
                    {o.jam} jam, <span className="text-garis font-semibold">{o.persen}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-garis/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-bola"
                    initial={{ width: 0 }}
                    animate={{ width: `${o.persen}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            ))}
            {okupansi.length === 0 && <p className="text-sm text-redup">Belum ada lapangan.</p>}
          </div>
        </div>
      </div>

      {err && <p className="pesan-galat">{err}</p>}
      {data && (
        <>
          {data.transaksi.length === 0 ? (
            <p className="text-sm text-redup">Belum ada transaksi pada periode ini.</p>
          ) : (
            <div className="card !p-0 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-redup border-b border-garis/10">
                    <th className="font-medium px-5 py-3">Waktu</th>
                    <th className="font-medium px-3 py-3">Jenis</th>
                    <th className="font-medium px-3 py-3">Lapangan</th>
                    <th className="font-medium px-3 py-3">Pelanggan</th>
                    <th className="font-medium px-3 py-3">Metode</th>
                    <th className="font-medium px-5 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis/10">
                  {data.transaksi.map((t) => (
                    <tr key={t.id}>
                      <td className="px-5 py-2.5 whitespace-nowrap">{new Date(t.waktu).toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5">{t.jenis}</td>
                      <td className="px-3 py-2.5">{t.booking.lapangan.nama}</td>
                      <td className="px-3 py-2.5">{t.booking.user?.nama ?? t.booking.namaTamu}</td>
                      <td className="px-3 py-2.5">{t.metode}</td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{rp(t.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// UC-05 langkah 1: booking walk-in oleh Kasir/Owner
function WalkInPanel({ lapanganList, aksi }) {
  const [f, setF] = useState({ lapanganId: "", tanggal: hariIni(), jamMulai: 8, jumlahJam: 1, namaTamu: "", noHpTamu: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <section>
      <h2 className="judul-bagian mb-4 inline-flex items-center gap-2"><Footprints className="w-6 h-6 text-rompi-400" aria-hidden="true" />Booking walk-in</h2>
      <form
        className="card grid sm:grid-cols-3 gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await aksi(await post("/api/booking", f), "Booking walk-in dibuat. Catat pelunasan pada daftar transaksi.");
        }}
      >
        <label className="label !mb-0">Lapangan
          <select className="input mt-1.5" value={f.lapanganId} onChange={set("lapanganId")} required>
            <option value="">Pilih lapangan</option>
            {lapanganList.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
          </select>
        </label>
        <label className="label !mb-0">Tanggal
          <input className="input mt-1.5" type="date" value={f.tanggal} onChange={set("tanggal")} required />
        </label>
        <label className="label !mb-0">Jam mulai (0 sampai 23)
          <input className="input mt-1.5" type="number" min="0" max="23" value={f.jamMulai} onChange={set("jamMulai")} required />
        </label>
        <label className="label !mb-0">Durasi (jam)
          <input className="input mt-1.5" type="number" min="1" max="12" value={f.jumlahJam} onChange={set("jumlahJam")} required />
        </label>
        <label className="label !mb-0">Nama tamu
          <input className="input mt-1.5" value={f.namaTamu} onChange={set("namaTamu")} required />
        </label>
        <label className="label !mb-0">No. HP (opsional)
          <input className="input mt-1.5" inputMode="tel" value={f.noHpTamu} onChange={set("noHpTamu")} />
        </label>
        <button className="btn-primary sm:col-span-3 sm:justify-self-start gap-1.5"><Plus className="w-4 h-4" aria-hidden="true" />Buat Booking Walk-in</button>
      </form>
    </section>
  );
}

// UC-06 Kelola Lapangan dan Harga
function LapanganPanel({ lapanganList, aksi }) {
  const { konfirmasi } = useUmpan();
  const [form, setForm] = useState({ nama: "", jenis: "Indoor", hargaPerJam: "" });
  const [harga, setHarga] = useState({});
  return (
    <section>
      <h2 className="judul-bagian mb-4">Kelola lapangan dan harga</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          {lapanganList.map((l) => (
            <div key={l.id} className="card !py-3 flex flex-wrap justify-between items-center gap-3 text-sm">
              <span>
                <span className="block font-semibold">{l.nama}</span>
                <span className="block text-redup">{l.jenis}</span>
              </span>
              <span className="flex items-center gap-2.5">
                <input
                  className="input !w-28 !py-1.5"
                  type="number"
                  aria-label={`Harga per jam ${l.nama}`}
                  value={harga[l.id] ?? l.hargaPerJam}
                  onChange={(e) => setHarga((h) => ({ ...h, [l.id]: e.target.value }))}
                />
                <button
                  className="btn-outline btn-kecil"
                  onClick={async () => aksi(await post(`/api/lapangan/${l.id}`, { hargaPerJam: Number(harga[l.id] ?? l.hargaPerJam) }, "PATCH"), "Harga diperbarui.")}
                >
                  Simpan
                </button>
                <button
                  className="btn-bahaya"
                  onClick={async () => {
                    const ok = await konfirmasi({
                      judul: `Nonaktifkan ${l.nama}?`,
                      isi: "Lapangan tidak akan tampil di halaman booking pelanggan.",
                      tombol: "Nonaktifkan",
                      bahaya: true,
                    });
                    if (ok) aksi(await post(`/api/lapangan/${l.id}`, { aktif: false }, "PATCH"), "Lapangan dinonaktifkan.");
                  }}
                >
                  Nonaktifkan
                </button>
              </span>
            </div>
          ))}
        </div>
        <form
          className="card space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await aksi(await post("/api/lapangan", { ...form, hargaPerJam: Number(form.hargaPerJam) }), "Lapangan ditambahkan.");
            if (ok) setForm({ nama: "", jenis: "Indoor", hargaPerJam: "" });
          }}
        >
          <p className="font-display text-xl font-semibold">Tambah lapangan baru</p>
          <input className="input" aria-label="Nama lapangan" placeholder="Nama lapangan" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} required />
          <select className="input" aria-label="Jenis lapangan" value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}>
            <option>Indoor</option><option>Outdoor</option><option>Synthetic Grass</option>
          </select>
          <input className="input" type="number" aria-label="Harga per jam" placeholder="Harga per jam" value={form.hargaPerJam} onChange={(e) => setForm((f) => ({ ...f, hargaPerJam: e.target.value }))} required />
          <button className="btn-primary w-full gap-1.5"><Plus className="w-4 h-4" aria-hidden="true" />Tambah lapangan</button>
        </form>
      </div>
    </section>
  );
}

// UC-06 Blokir Jadwal
function BlokirPanel({ lapanganList, aksi }) {
  const [f, setF] = useState({ lapanganId: "", tanggal: hariIni(), jamMulai: 8, jumlahJam: 1, alasan: "" });
  const [daftar, setDaftar] = useState([]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const muat = () => fetch("/api/blokir").then((r) => r.json()).then((d) => Array.isArray(d) && setDaftar(d));
  useEffect(() => { muat(); }, []);
  return (
    <section>
      <h2 className="judul-bagian mb-4 inline-flex items-center gap-2"><CalendarX className="w-6 h-6 text-rompi-400" aria-hidden="true" />Blokir jadwal</h2>
      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <form
          className="card grid grid-cols-2 gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await aksi(await post("/api/blokir", f), "Jadwal diblokir.")) muat();
          }}
        >
          <label className="label !mb-0 col-span-2">Lapangan
            <select className="input mt-1.5" value={f.lapanganId} onChange={set("lapanganId")} required>
              <option value="">Pilih lapangan</option>
              {lapanganList.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
            </select>
          </label>
          <label className="label !mb-0 col-span-2">Tanggal
            <input className="input mt-1.5" type="date" value={f.tanggal} onChange={set("tanggal")} required />
          </label>
          <label className="label !mb-0">Jam mulai
            <input className="input mt-1.5" type="number" min="0" max="23" value={f.jamMulai} onChange={set("jamMulai")} required />
          </label>
          <label className="label !mb-0">Durasi (jam)
            <input className="input mt-1.5" type="number" min="1" max="24" value={f.jumlahJam} onChange={set("jumlahJam")} required />
          </label>
          <label className="label !mb-0 col-span-2">Alasan (opsional)
            <input className="input mt-1.5" placeholder="Misalnya perawatan" value={f.alasan} onChange={set("alasan")} />
          </label>
          <button className="btn-primary col-span-2 justify-self-start gap-1.5"><Ban className="w-4 h-4" aria-hidden="true" />Blokir jadwal</button>
        </form>
        <div className="card !p-0 divide-y divide-garis/10 text-sm">
          {daftar.length === 0 && <p className="text-redup px-5 py-4">Tidak ada slot yang diblokir.</p>}
          {daftar.map((b) => (
            <div key={b.id} className="flex justify-between items-center gap-3 px-5 py-3">
              <span>
                <span className="font-semibold">{b.lapangan.nama}</span>
                <span className="text-redup">, {b.tanggal}, {jamStr(b.jam)}{b.alasan ? `, ${b.alasan}` : ""}</span>
              </span>
              <button className="btn-outline btn-kecil gap-1.5" onClick={async () => { await aksi(await fetch(`/api/blokir/${b.id}`, { method: "DELETE" }), "Blokir dibuka."); muat(); }}>
                <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                Buka blokir
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Aturan DP (persentase DP dan perlakuan DP saat batal)
function PengaturanPanel({ aksi }) {
  const [p, setP] = useState(null);
  useEffect(() => { fetch("/api/pengaturan").then((r) => r.json()).then(setP); }, []);
  if (!p) return null;
  return (
    <section>
      <h2 className="judul-bagian mb-4 inline-flex items-center gap-2"><Settings2 className="w-6 h-6 text-rompi-400" aria-hidden="true" />Aturan DP</h2>
      <form
        className="card flex items-end gap-4 flex-wrap"
        onSubmit={async (e) => { e.preventDefault(); await aksi(await post("/api/pengaturan", p, "PUT"), "Aturan disimpan."); }}
      >
        <label className="label !mb-0">DP (%)
          <input className="input mt-1.5" type="number" min="10" max="100" value={p.dpPersen} onChange={(e) => setP({ ...p, dpPersen: Number(e.target.value) })} />
        </label>
        <label className="label !mb-0">Jika booking dibatalkan
          <select className="input mt-1.5" value={p.perlakuanDpBatal} onChange={(e) => setP({ ...p, perlakuanDpBatal: e.target.value })}>
            <option value="HANGUS">DP hangus</option>
            <option value="DIKEMBALIKAN">DP dikembalikan</option>
          </select>
        </label>
        <button className="btn-primary gap-1.5"><Save className="w-4 h-4" aria-hidden="true" />Simpan</button>
      </form>
    </section>
  );
}
