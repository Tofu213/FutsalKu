"use client";

import { useEffect, useState } from "react";

const LABEL_STATUS = {
  MENUNGGU_PEMBAYARAN: { text: "Menunggu Pembayaran", cls: "bg-yellow-100 text-yellow-700" },
  TERKONFIRMASI: { text: "Terkonfirmasi (DP)", cls: "bg-blue-100 text-blue-700" },
  LUNAS: { text: "Lunas", cls: "bg-green-100 text-green-700" },
  SELESAI: { text: "Selesai", cls: "bg-gray-200 text-gray-700" },
  DIBATALKAN: { text: "Dibatalkan", cls: "bg-red-100 text-red-700" },
};

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
  const [pesan, setPesan] = useState("");

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
    setPesan(res.ok ? sukses || "Berhasil." : d.error || "Gagal.");
    if (res.ok) muatSemua();
    return res.ok;
  }

  const ubahStatus = (id, action) => post(`/api/booking/${id}`, { action }, "PATCH").then((r) => aksi(r));

  // UC-03 (lanjutan): konfirmasi DP yang diterima dari pelanggan
  function konfirmasiDp(b) {
    if (!confirm("Konfirmasi DP sudah diterima dari pelanggan?")) return;
    post(`/api/booking/${b.id}`, { action: "konfirmasi_dp", metode: "Transfer" }, "PATCH").then((r) =>
      aksi(r, "DP dikonfirmasi. Booking berstatus Terkonfirmasi.")
    );
  }

  // UC-05: pelunasan = sisa tagihan (total - pembayaran tercatat), lalu nota terbit
  function lunasi(b) {
    const sisa = b.totalHarga - b.pembayaran.reduce((s, p) => s + p.nominal, 0);
    if (!confirm(`Terima pelunasan ${rp(sisa)}?`)) return;
    post(`/api/booking/${b.id}/pelunasan`, { nominal: sisa, metode: "Tunai" }).then((r) =>
      aksi(r, "Pelunasan dicatat dan nota diterbitkan.")
    );
  }

  const namaPelanggan = (b) => b.user?.nama ?? `${b.namaTamu} (walk-in)`;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Dashboard {isOwner ? "Owner" : "Kasir"}</h1>
      {pesan && <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">{pesan}</p>}

      {isOwner && <LaporanPanel />}

      <section>
        <h2 className="font-semibold mb-3">Semua Transaksi</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!bookings ? (
          <p className="text-gray-500 text-sm">Memuat...</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const status = LABEL_STATUS[b.status];
              return (
                <div key={b.id} className="card flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">
                      {b.lapangan.nama} — {namaPelanggan(b)}
                      {b.user?.noHp ? ` (${b.user.noHp})` : ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {b.tanggal} • {jamStr(b.jamMulai)} ({b.jumlahJam} jam) • {rp(b.totalHarga)}
                    </p>
                    {b.nota && (
                      <p className="text-xs text-gray-500">
                        Nota: {b.nota.noNota}{" "}
                        <a href={`/nota/${b.id}`} className="text-lapangan-700 hover:underline">Lihat nota</a>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${status.cls}`}>{status.text}</span>
                    {b.status === "MENUNGGU_PEMBAYARAN" && (
                      <button onClick={() => konfirmasiDp(b)} className="btn-primary !py-1 text-xs">
                        Konfirmasi DP
                      </button>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => lunasi(b)} className="btn-outline !py-1 text-xs">
                        Catat Pelunasan
                      </button>
                    )}
                    {b.status === "LUNAS" && (
                      <button onClick={() => ubahStatus(b.id, "selesai")} className="btn-outline !py-1 text-xs">
                        Tandai Selesai
                      </button>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => ubahStatus(b.id, "batal")} className="text-xs text-red-600 hover:underline">
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
function LaporanPanel() {
  const [periode, setPeriode] = useState("harian");
  const [tanggal, setTanggal] = useState(hariIni());
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    fetch(`/api/laporan?periode=${periode}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => (d.error ? (setErr(d.error), setData(null)) : setData(d)));
  }, [periode, tanggal]);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="font-semibold">Laporan Pendapatan</h2>
        <select className="input !w-auto" value={periode} onChange={(e) => setPeriode(e.target.value)}>
          <option value="harian">Harian</option>
          <option value="bulanan">Bulanan</option>
        </select>
        <input className="input !w-auto" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {data && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="card"><p className="text-xs text-gray-500">DP diterima</p><p className="font-bold">{rp(data.dpDiterima)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Pelunasan</p><p className="font-bold">{rp(data.pelunasan)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">DP dikembalikan</p><p className="font-bold">{rp(data.dpDikembalikan)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Pendapatan bersih</p><p className="font-bold text-lapangan-700">{rp(data.pendapatanBersih)}</p></div>
          </div>
          {data.transaksi.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada transaksi pada periode ini.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {data.transaksi.map((t) => (
                <div key={t.id} className="flex justify-between border-b py-1">
                  <span>
                    {new Date(t.waktu).toLocaleString("id-ID")} • {t.jenis} • {t.booking.lapangan.nama} •{" "}
                    {t.booking.user?.nama ?? t.booking.namaTamu}
                  </span>
                  <span>{rp(t.nominal)} ({t.metode})</span>
                </div>
              ))}
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
      <h2 className="font-semibold mb-3">Booking Walk-in</h2>
      <form
        className="card grid sm:grid-cols-3 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await aksi(await post("/api/booking", f), "Booking walk-in dibuat. Catat pelunasan pada daftar transaksi.");
        }}
      >
        <select className="input" value={f.lapanganId} onChange={set("lapanganId")} required>
          <option value="">Pilih lapangan</option>
          {lapanganList.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
        </select>
        <input className="input" type="date" value={f.tanggal} onChange={set("tanggal")} required />
        <input className="input" type="number" min="0" max="23" value={f.jamMulai} onChange={set("jamMulai")} placeholder="Jam mulai" required />
        <input className="input" type="number" min="1" max="12" value={f.jumlahJam} onChange={set("jumlahJam")} placeholder="Durasi (jam)" required />
        <input className="input" value={f.namaTamu} onChange={set("namaTamu")} placeholder="Nama tamu" required />
        <input className="input" value={f.noHpTamu} onChange={set("noHpTamu")} placeholder="No. HP (opsional)" />
        <button className="btn-primary sm:col-span-3">Buat Booking Walk-in</button>
      </form>
    </section>
  );
}

// UC-06 Kelola Lapangan dan Harga
function LapanganPanel({ lapanganList, aksi }) {
  const [form, setForm] = useState({ nama: "", jenis: "Indoor", hargaPerJam: "" });
  const [harga, setHarga] = useState({});
  return (
    <section>
      <h2 className="font-semibold mb-3">Kelola Lapangan dan Harga</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          {lapanganList.map((l) => (
            <div key={l.id} className="card !py-3 flex justify-between items-center gap-2 text-sm">
              <span>{l.nama} ({l.jenis})</span>
              <span className="flex items-center gap-1">
                <input
                  className="input !w-28 !py-1"
                  type="number"
                  value={harga[l.id] ?? l.hargaPerJam}
                  onChange={(e) => setHarga((h) => ({ ...h, [l.id]: e.target.value }))}
                />
                <button
                  className="btn-outline !py-1 text-xs"
                  onClick={async () => aksi(await post(`/api/lapangan/${l.id}`, { hargaPerJam: Number(harga[l.id] ?? l.hargaPerJam) }, "PATCH"), "Harga diperbarui.")}
                >
                  Simpan
                </button>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={async () => aksi(await post(`/api/lapangan/${l.id}`, { aktif: false }, "PATCH"), "Lapangan dinonaktifkan.")}
                >
                  Nonaktifkan
                </button>
              </span>
            </div>
          ))}
        </div>
        <form
          className="card space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await aksi(await post("/api/lapangan", { ...form, hargaPerJam: Number(form.hargaPerJam) }), "Lapangan ditambahkan.");
            if (ok) setForm({ nama: "", jenis: "Indoor", hargaPerJam: "" });
          }}
        >
          <p className="text-sm font-medium">Tambah Lapangan Baru</p>
          <input className="input" placeholder="Nama lapangan" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} required />
          <select className="input" value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}>
            <option>Indoor</option><option>Outdoor</option><option>Synthetic Grass</option>
          </select>
          <input className="input" type="number" placeholder="Harga per jam" value={form.hargaPerJam} onChange={(e) => setForm((f) => ({ ...f, hargaPerJam: e.target.value }))} required />
          <button className="btn-primary w-full">Tambah</button>
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
      <h2 className="font-semibold mb-3">Blokir Jadwal</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <form
          className="card grid grid-cols-2 gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await aksi(await post("/api/blokir", f), "Jadwal diblokir.")) muat();
          }}
        >
          <select className="input col-span-2" value={f.lapanganId} onChange={set("lapanganId")} required>
            <option value="">Pilih lapangan</option>
            {lapanganList.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
          </select>
          <input className="input" type="date" value={f.tanggal} onChange={set("tanggal")} required />
          <input className="input" type="number" min="0" max="23" value={f.jamMulai} onChange={set("jamMulai")} required />
          <input className="input" type="number" min="1" max="24" value={f.jumlahJam} onChange={set("jumlahJam")} required />
          <input className="input" placeholder="Alasan (mis. perawatan)" value={f.alasan} onChange={set("alasan")} />
          <button className="btn-primary col-span-2">Blokir</button>
        </form>
        <div className="space-y-1 text-sm">
          {daftar.length === 0 && <p className="text-gray-500">Tidak ada slot yang diblokir.</p>}
          {daftar.map((b) => (
            <div key={b.id} className="flex justify-between border-b py-1">
              <span>{b.lapangan.nama} • {b.tanggal} • {jamStr(b.jam)} {b.alasan ? `• ${b.alasan}` : ""}</span>
              <button className="text-xs text-red-600 hover:underline" onClick={async () => { await fetch(`/api/blokir/${b.id}`, { method: "DELETE" }); muat(); }}>
                Buka
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
      <h2 className="font-semibold mb-3">Aturan DP</h2>
      <form
        className="card flex items-end gap-3 flex-wrap"
        onSubmit={async (e) => { e.preventDefault(); await aksi(await post("/api/pengaturan", p, "PUT"), "Aturan disimpan."); }}
      >
        <label className="text-sm">DP (%)
          <input className="input" type="number" min="10" max="100" value={p.dpPersen} onChange={(e) => setP({ ...p, dpPersen: Number(e.target.value) })} />
        </label>
        <label className="text-sm">Jika booking dibatalkan
          <select className="input" value={p.perlakuanDpBatal} onChange={(e) => setP({ ...p, perlakuanDpBatal: e.target.value })}>
            <option value="HANGUS">DP hangus</option>
            <option value="DIKEMBALIKAN">DP dikembalikan</option>
          </select>
        </label>
        <button className="btn-primary">Simpan</button>
      </form>
    </section>
  );
}
