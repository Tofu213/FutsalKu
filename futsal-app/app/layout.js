import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "FutsalKu — Sistem Penyewaan Lapangan Futsal",
  description: "Booking lapangan futsal online, cepat dan tanpa ribet.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
