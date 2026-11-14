"use client";

import Link from "next/link";
import { batasBayarDp } from "@/lib/konstanta";
import { useEffect, useState } from "react";

const LABEL_STATUS = {
  MENUNGGU_PEMBAYARAN: { text: "Menunggu Pembayaran", cls: "bg-yellow-100 text-yellow-700" },
  TERKONFIRMASI: { text: "Terkonfirmasi (DP)", cls: "bg-blue-100 text-blue-700" },
  LUNAS: { text: "Lunas", cls: "bg-green-100 text-green-700" },
  SELESAI: { text: "Selesai", cls: "bg-gray-200 text-gray-700" },
  DIBATALKAN: { text: "Dibatalkan", cls: "bg-red-100 text-red-700" },
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!bookings) return <p className="text-gray-500">Memuat riwayat...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Riwayat Booking Saya</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada riwayat booking.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const status = LABEL_STATUS[b.status];
            return (
              <div key={b.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-semibold">{b.lapangan.nama}</p>
                  <p className="text-sm text-gray-500">
                    {b.tanggal} • {String(b.jamMulai).padStart(2, "0")}:00 ({b.jumlahJam} jam)
                  </p>
                  <p className="text-sm text-gray-500">
                    Total Rp{b.totalHarga.toLocaleString("id-ID")} • DP Rp
                    {b.dpDibayar.toLocaleString("id-ID")}
                  </p>
                  {b.status === "MENUNGGU_PEMBAYARAN" && (
                    <p className="text-xs text-yellow-700">
                      Bayar DP ke Kasir sebelum{" "}
                      {batasBayarDp(b.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}{" "}
                      WIB, jika tidak booking dibatalkan otomatis.
                    </p>
                  )}
                  {b.nota && (
                    <p className="text-xs text-gray-500">
                      Nota: {b.nota.noNota}{" "}
                      <Link href={`/nota/${b.id}`} className="text-lapangan-700 hover:underline">Lihat nota</Link>
                    </p>
                  )}
                  {b.status === "DIBATALKAN" && b.perlakuanDp && (
                    <p className="text-xs text-gray-500">
                      DP {b.perlakuanDp === "HANGUS" ? "hangus" : "dikembalikan"}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <span className={`badge ${status.cls}`}>{status.text}</span>
                  {["MENUNGGU_PEMBAYARAN", "TERKONFIRMASI"].includes(b.status) && (
                    <button
                      onClick={() => batalkan(b.id)}
                      className="block text-xs text-red-600 hover:underline ml-auto"
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
