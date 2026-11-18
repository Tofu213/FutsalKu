import { prisma } from "@/lib/prisma";
import { BATAS_DP_JAM } from "@/lib/konstanta";
import Court, { warnaLantai } from "@/components/Court";
import Link from "next/link";
import { CalendarCheck, ChevronRight, Clock, Receipt, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

const LANGKAH = [
  { ikon: CalendarCheck, judul: "Pilih slot", isi: "Tentukan lapangan, tanggal, dan jam mulai. Slot langsung dikunci atas nama Anda." },
  { ikon: Wallet, judul: "Bayar DP", isi: `Serahkan DP ke Kasir, lewat transfer atau di lokasi, paling lambat ${BATAS_DP_JAM} jam setelah booking.` },
  { ikon: Receipt, judul: "Main dan lunasi", isi: "Datang sesuai jadwal, lunasi sisanya di kasir, dan nota digital langsung terbit." },
];

export default async function HomePage() {
  const lapangan = await prisma.lapangan.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });
  const hargaTermurah = lapangan.length ? Math.min(...lapangan.map((l) => l.hargaPerJam)) : null;

  return (
    <div className="space-y-14 sm:space-y-20">
      <section className="relative overflow-hidden rounded-3xl bg-pitch-700 border border-garis/10">
        <Court
          animasi
          className="absolute -right-24 sm:right-[-4%] top-1/2 -translate-y-1/2 w-[640px] sm:w-[62%] max-w-none text-garis/40 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-800 via-pitch-800/85 to-transparent" />
        <div className="relative px-6 py-14 sm:px-12 sm:py-20 max-w-2xl">
          <h1 className="font-display font-bold text-5xl sm:text-7xl leading-[0.95] tracking-tight">
            Kunci lapangannya dulu, baru kumpulkan tim.
          </h1>
          <p className="text-redup text-lg mt-5 max-w-md">
            Lihat jam yang masih kosong, booking dari HP, dan bayar DP ke kasir. Tidak perlu menunggu balasan chat.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link href="/booking" className="btn-primary text-base !px-7 !py-3">
              Booking sekarang
            </Link>
            {hargaTermurah !== null && (
              <p className="text-sm text-redup inline-flex items-center gap-1.5 flex-wrap">
                <Clock className="w-4 h-4" aria-hidden="true" />
                Mulai <span className="angka text-xl text-bola">Rp{hargaTermurah.toLocaleString("id-ID")}</span> per jam
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
          <h2 className="judul-bagian text-3xl">Pilih lapangan</h2>
          <p className="text-sm text-redup">{lapangan.length} lapangan aktif</p>
        </div>
        {lapangan.length === 0 ? (
          <p className="card text-redup text-sm">
            Belum ada lapangan terdaftar. Jalankan{" "}
            <code className="bg-pitch-950 px-1.5 py-0.5 rounded">npm run seed</code> untuk mengisi data contoh.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lapangan.map((l) => (
              <Link
                key={l.id}
                href={`/booking?lapanganId=${l.id}`}
                className="group card !p-0 overflow-hidden hover:border-garis/40 transition-colors"
              >
                <div className="p-4 pb-0">
                  <Court lantai={warnaLantai(l.jenis)} className="w-full text-white/80 rounded-lg" />
                </div>
                <div className="p-5">
                  <p className="text-sm text-redup">{l.jenis}</p>
                  <h3 className="font-display text-2xl font-semibold leading-tight mt-0.5">{l.nama}</h3>
                  <div className="flex items-end justify-between mt-4">
                    <p>
                      <span className="angka text-3xl text-bola">Rp{l.hargaPerJam.toLocaleString("id-ID")}</span>
                      <span className="text-sm text-redup"> /jam</span>
                    </p>
                    <span className="inline-flex items-center text-sm font-semibold text-rompi-400 group-hover:text-rompi-300">
                      Lihat jadwal
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="judul-bagian text-3xl mb-6">Cara booking</h2>
        <ol className="grid sm:grid-cols-3 gap-5">
          {LANGKAH.map((s, i) => (
            <li key={s.judul} className="border-t-2 border-rompi-500 pt-4">
              <div className="flex items-center justify-between">
                <p className="angka text-5xl text-garis/25 leading-none">{i + 1}</p>
                <s.ikon className="w-7 h-7 text-rompi-400" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-semibold mt-2">{s.judul}</h3>
              <p className="text-redup mt-1.5">{s.isi}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
