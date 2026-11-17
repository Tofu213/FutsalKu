"use client";

import Link from "next/link";
import { batasBayarDp } from "@/lib/konstanta";
import { useEffect, useState } from "react";

const LABEL_STATUS = {
  MENUNGGU_PEMBAYARAN: { text: "Menunggu Pembayaran", cls: "status-menunggu" },
  TERKONFIRMASI: { text: "Terkonfirmasi (DP)", cls: "status-terkonfirmasi" },
  LUNAS: { text: "Lunas", cls: "status-lunas" },
  SELESAI: { text: "Selesai", cls: "status-selesai" },
  DIBATALKAN: { text: "Dibatalkan", cls: "status-batal" },
};

export default function RiwayatPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  function muatData() {
    fetch("/api/booking")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setBookings(d) : setError(d.error || "Gagal memuat data.")));
  }

  useEffect(muatData, []);

  async function batalkan(id) {
    // UC-04 langkah 3: tampilkan konfirmasi beserta aturan DP yang berlaku
    const aturan = await fetch("/api/pengaturan").then((r) => r.json()).catch(() => null);
    const infoDp = aturan?.perlakuanDpBatal
      ? ` DP akan ${aturan.perlakuanDpBatal === "HANGUS" ? "hangus" : "dikembalikan"} sesuai aturan.`
      : "";
    if (!confirm("Yakin ingin membatalkan booking ini?" + infoDp)) return;
    const res = await fetch(`/api/booking/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batal" }),
    });
    if (res.ok) muatData();
  }

  if (error) return <p className="pesan-galat">{error}</p>;
  if (!bookings) return <p className="text-redup">Memuat riwayat...</p>;

  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const rp = (n) => "Rp" + n.toLocaleString("id-ID");
  const jamStr = (j) => String(j).padStart(2, "0") + ".00";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <h1 className="judul-halaman">Riwayat booking</h1>
        <Link href="/booking" className="btn-primary btn-kecil">
          Booking baru
        </Link>
      </div>
      {bookings.length === 0 ? (
        <div className="card text-center py-10">
          <p className="font-display text-2xl font-semibold">Belum ada booking</p>
          <p className="text-redup mt-1">Booking pertama Anda akan muncul di sini.</p>
          <Link href="/booking" className="btn-primary mt-5">
            Pilih jadwal
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = LABEL_STATUS[b.status];
            const [, bln, tgl] = b.tanggal.split("-");
            const batal = b.status === "DIBATALKAN";
            return (
              <div key={b.id} className={`card flex gap-4 sm:gap-5 ${batal ? "opacity-70" : ""}`}>
                <div className="shrink-0 w-16 text-center rounded-xl bg-pitch-950/60 py-2.5 self-start">
                  <p className="angka text-3xl leading-none">{tgl}</p>
                  <p className="text-xs text-redup mt-1">
                    {BULAN[Number(bln) - 1]} {b.tanggal.slice(0, 4)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-display text-2xl font-semibold leading-tight">{b.lapangan.nama}</p>
                    <span className={`badge ${status.cls}`}>{status.text}</span>
                  </div>
                  <p className="text-sm text-redup mt-1">
                    {jamStr(b.jamMulai)} sampai {jamStr(b.jamMulai + b.jumlahJam)} ({b.jumlahJam} jam)
                  </p>
                  <p className="text-sm mt-2">
                    Total <span className="font-semibold">{rp(b.totalHarga)}</span>
                    <span className="text-redup">, DP dibayar {rp(b.dpDibayar)}</span>
                  </p>
                  {b.status === "MENUNGGU_PEMBAYARAN" && (
                    <p className="text-sm text-bola mt-2">
                      Bayar DP ke Kasir sebelum{" "}
                      {batasBayarDp(b.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}{" "}
                      WIB, jika tidak booking dibatalkan otomatis.
                    </p>
                  )}
                  {batal && b.perlakuanDp && (
                    <p className="text-sm text-redup mt-2">
                      DP {b.perlakuanDp === "HANGUS" ? "hangus" : "dikembalikan"}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 empty:hidden">
                    {b.nota && (
                      <Link href={`/nota/${b.id}`} className="text-sm font-semibold text-rompi-400 hover:text-rompi-300">
                        Lihat nota {b.nota.noNota}
                      </Link>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => batalkan(b.id)} className="btn-bahaya">
                        Batalkan booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
