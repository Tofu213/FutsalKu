// Gambar lapangan futsal tampak atas. Dipakai di hero (animasi) dan kartu lapangan.
// Ukuran viewBox 200 x 120 mengikuti perbandingan lapangan futsal (kira-kira 40 m x 20-24 m).
export default function Court({ className = "", animasi = false, lantai }) {
  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-label="Lapangan futsal tampak atas">
      {lantai && <rect x="0" y="0" width="200" height="120" rx="6" fill={lantai} />}
      <g
        className={animasi ? "garis-lapangan" : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <rect x="8" y="8" width="184" height="104" rx="1" pathLength="1" />
        <line x1="100" y1="8" x2="100" y2="112" pathLength="1" />
        <circle cx="100" cy="60" r="16" pathLength="1" />
        <path d="M8 32 A28 28 0 0 1 36 60 A28 28 0 0 1 8 88" pathLength="1" />
        <path d="M192 32 A28 28 0 0 0 164 60 A28 28 0 0 0 192 88" pathLength="1" />
        <rect x="2" y="50" width="6" height="20" pathLength="1" />
        <rect x="192" y="50" width="6" height="20" pathLength="1" />
      </g>
      <circle cx="100" cy="60" r="1.6" fill="currentColor" />
      <circle cx="30" cy="60" r="1.2" fill="currentColor" />
      <circle cx="170" cy="60" r="1.2" fill="currentColor" />
    </svg>
  );
}

// Warna lantai mengikuti jenis lapangan
export function warnaLantai(jenis = "") {
  const j = jenis.toLowerCase();
  if (j.includes("grass") || j.includes("rumput") || j.includes("sintetis")) return "#2F8F53";
  if (j.includes("outdoor")) return "#B4573D";
  return "#2563A8"; // indoor / vinyl
}
