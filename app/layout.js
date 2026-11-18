import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

export const metadata = {
  title: "FutsalKu — Sistem Penyewaan Lapangan Futsal",
  description: "Booking lapangan futsal online, cepat dan tanpa ribet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Providers>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 mt-8 border-t border-garis/10 text-sm text-redup flex flex-wrap justify-between gap-2">
          <span>FutsalKu, sistem penyewaan lapangan futsal</span>
          <span>Buka setiap hari, 08.00 sampai 24.00 WIB</span>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
