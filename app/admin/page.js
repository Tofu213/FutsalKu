"use client";

import { useEffect, useState } from "react";

const LABEL_STATUS = {
  MENUNGGU_PEMBAYARAN: { text: "Menunggu Pembayaran", cls: "status-menunggu" },
  TERKONFIRMASI: { text: "Terkonfirmasi (DP)", cls: "status-terkonfirmasi" },
  LUNAS: { text: "Lunas", cls: "status-lunas" },
  SELESAI: { text: "Selesai", cls: "status-selesai" },
  DIBATALKAN: { text: "Dibatalkan", cls: "status-batal" },
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
    <div className="space-y-12">
      <div>
        <h1 className="judul-halaman">Dashboard {isOwner ? "Owner" : "Kasir"}</h1>
        {me && <p className="text-redup mt-2">Masuk sebagai {me.nama}</p>}
      </div>
      {pesan && <p className="pesan-info" role="status">{pesan}</p>}

      {isOwner && <LaporanPanel />}

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
              const status = LABEL_STATUS[b.status];
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
                        <a href={`/nota/${b.id}`} className="font-semibold text-rompi-400 hover:text-rompi-300">Lihat nota</a>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="angka text-xl mr-1">{rp(b.totalHarga)}</span>
                    <span className={`badge ${status.cls}`}>{status.text}</span>
                    {b.status === "MENUNGGU_PEMBAYARAN" && (
                      <button onClick={() => konfirmasiDp(b)} className="btn-primary btn-kecil">
                        Konfirmasi DP
                      </button>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => lunasi(b)} className="btn-outline btn-kecil">
                        Catat Pelunasan
                      </button>
                    )}
                    {b.status === "LUNAS" && (
                      <button onClick={() => ubahStatus(b.id, "selesai")} className="btn-outline btn-kecil">
                        Tandai Selesai
                      </button>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => ubahStatus(b.id, "batal")} className="btn-bahaya">
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
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h2 className="judul-bagian">Laporan pendapatan</h2>
        <div className="flex items-center gap-2">
          <select className="input !w-auto" aria-label="Periode laporan" value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option value="harian">Harian</option>
            <option value="bulanan">Bulanan</option>
          </select>
          <input className="input !w-auto" aria-label="Tanggal laporan" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
      </div>
      {err && <p className="pesan-galat">{err}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card"><p className="text-sm text-redup">DP diterima</p><p className="angka text-3xl mt-1">{rp(data.dpDiterima)}</p></div>
            <div className="card"><p className="text-sm text-redup">Pelunasan</p><p className="angka text-3xl mt-1">{rp(data.pelunasan)}</p></div>
            <div className="card"><p className="text-sm text-redup">DP dikembalikan</p><p className="angka text-3xl mt-1">{rp(data.dpDikembalikan)}</p></div>
            <div className="card !bg-pitch-700 !border-bola/40"><p className="text-sm text-redup">Pendapatan bersih</p><p className="angka text-3xl mt-1 text-bola">{rp(data.pendapatanBersih)}</p></div>
          </div>
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
      <h2 className="judul-bagian mb-4">Booking walk-in</h2>
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
        <button className="btn-primary sm:col-span-3 sm:justify-self-start">Buat Booking Walk-in</button>
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
                  onClick={async () => aksi(await post(`/api/lapangan/${l.id}`, { aktif: false }, "PATCH"), "Lapangan dinonaktifkan.")}
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
      <h2 className="judul-bagian mb-4">Blokir jadwal</h2>
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
          <button className="btn-primary col-span-2 justify-self-start">Blokir jadwal</button>
        </form>
        <div className="card !p-0 divide-y divide-garis/10 text-sm">
          {daftar.length === 0 && <p className="text-redup px-5 py-4">Tidak ada slot yang diblokir.</p>}
          {daftar.map((b) => (
            <div key={b.id} className="flex justify-between items-center gap-3 px-5 py-3">
              <span>
                <span className="font-semibold">{b.lapangan.nama}</span>
                <span className="text-redup">, {b.tanggal}, {jamStr(b.jam)}{b.alasan ? `, ${b.alasan}` : ""}</span>
              </span>
              <button className="btn-outline btn-kecil" onClick={async () => { await fetch(`/api/blokir/${b.id}`, { method: "DELETE" }); muat(); }}>
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
      <h2 className="judul-bagian mb-4">Aturan DP</h2>
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
        <button className="btn-primary">Simpan</button>
      </form>
    </section>
  );
}
