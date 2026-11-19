"use client";

import Link from "next/link";
import { batasBayarDp } from "@/lib/konstanta";
import { useEffect, useState } from "react";
import { CalendarPlus, Clock, Receipt, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useUmpan } from "@/components/Umpan";


export default function RiwayatPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const { toast, konfirmasi } = useUmpan();

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
    const ok = await konfirmasi({
      judul: "Batalkan booking ini?",
      isi: "Slot akan dilepas untuk pelanggan lain." + infoDp,
      tombol: "Ya, batalkan",
      batal: "Tidak jadi",
      bahaya: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/booking/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batal" }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      toast("Booking dibatalkan.");
      muatData();
    } else {
      toast(d.error || "Booking gagal dibatalkan.", "galat");
    }
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
        <Link href="/booking" className="btn-primary btn-kecil gap-1.5">
          <CalendarPlus className="w-4 h-4" aria-hidden="true" />
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
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-redup mt-1 inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" aria-hidden="true" />
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
                      <Link href={`/nota/${b.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rompi-400 hover:text-rompi-300">
                        <Receipt className="w-4 h-4" aria-hidden="true" />
                        Lihat nota {b.nota.noNota}
                      </Link>
                    )}
                    {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                      <button onClick={() => batalkan(b.id)} className="btn-bahaya inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
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
