import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lapangan = await prisma.lapangan.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
  });

  return (
    <div>
      <section className="text-center py-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Sewa Lapangan Futsal Jadi Lebih Mudah
        </h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          Cek ketersediaan jadwal secara real-time, booking online, dan bayar
          DP tanpa perlu menunggu balasan chat.
        </p>
        <Link href="/booking" className="btn-primary inline-block mt-5">
          Booking Sekarang
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Lapangan Tersedia</h2>
        {lapangan.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Belum ada lapangan terdaftar. Jalankan{" "}
            <code className="bg-gray-100 px-1 rounded">npm run seed</code>{" "}
            untuk mengisi data contoh.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {lapangan.map((l) => (
              <div key={l.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{l.nama}</h3>
                    <p className="text-sm text-gray-500">{l.jenis}</p>
                  </div>
                  <span className="badge bg-lapangan-50 text-lapangan-700">
                    Rp{l.hargaPerJam.toLocaleString("id-ID")}/jam
                  </span>
                </div>
                <Link
                  href={`/booking?lapanganId=${l.id}`}
                  className="btn-outline inline-block mt-4 text-sm"
                >
                  Lihat Jadwal & Booking
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
