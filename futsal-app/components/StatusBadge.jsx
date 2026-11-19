import { BadgeCheck, CheckCircle2, Clock, Flag, XCircle } from "lucide-react";

// Status selalu ditampilkan dengan ikon + teks, bukan warna saja
export const STATUS = {
  MENUNGGU_PEMBAYARAN: { text: "Menunggu Pembayaran", cls: "status-menunggu", ikon: Clock },
  TERKONFIRMASI: { text: "Terkonfirmasi (DP)", cls: "status-terkonfirmasi", ikon: BadgeCheck },
  LUNAS: { text: "Lunas", cls: "status-lunas", ikon: CheckCircle2 },
  SELESAI: { text: "Selesai", cls: "status-selesai", ikon: Flag },
  DIBATALKAN: { text: "Dibatalkan", cls: "status-batal", ikon: XCircle },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] ?? { text: status, cls: "status-selesai", ikon: Flag };
  const Ikon = s.ikon;
  return (
    <span className={`badge inline-flex items-center gap-1.5 ${s.cls}`}>
      <Ikon className="w-3.5 h-3.5" aria-hidden="true" />
      {s.text}
    </span>
  );
}
