"use client";

// Grafik batang uang masuk per hari dalam satu bulan (satu seri, satu warna).
// Arahkan kursor/fokus ke batang untuk melihat nilainya; klik untuk membuka laporan hari itu.
import { useEffect, useRef, useState } from "react";

const rpPendek = (n) =>
  n >= 1e6 ? `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt` : n >= 1e3 ? `${Math.round(n / 1e3)} rb` : `${n}`;
const rp = (n) => "Rp" + n.toLocaleString("id-ID");

function skalaAtas(maks) {
  if (maks <= 0) return 100000;
  const p = Math.pow(10, Math.floor(Math.log10(maks)));
  const langkah = [1, 2, 2.5, 5, 10].find((k) => k * p * 4 >= maks) ?? 10;
  return langkah * p * 4;
}

export default function GrafikPendapatan({ data, terpilih, onPilih }) {
  const wadah = useRef(null);
  const [lebar, setLebar] = useState(720);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!wadah.current) return;
    const ro = new ResizeObserver(([e]) => setLebar(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(wadah.current);
    return () => ro.disconnect();
  }, []);

  const tinggi = 220;
  const kiri = 52, kanan = 8, atas = 12, bawah = 26;
  const plotW = lebar - kiri - kanan;
  const plotH = tinggi - atas - bawah;
  const maks = skalaAtas(Math.max(0, ...data.map((d) => d.nilai)));
  const slot = plotW / data.length;
  const lebarBatang = Math.max(3, slot - 2); // celah 2px antarbatang
  const y = (v) => atas + plotH - (v / maks) * plotH;
  const garis = [0, 0.25, 0.5, 0.75, 1].map((k) => k * maks);
  const tiapLabel = lebar < 520 ? 5 : 2;
  const aktif = hover !== null ? data[hover] : null;

  return (
    <div ref={wadah} className="relative">
      <svg width={lebar} height={tinggi} className="block" role="img" aria-label="Grafik uang masuk per hari">
        {garis.map((g) => (
          <g key={g}>
            <line x1={kiri} x2={lebar - kanan} y1={y(g)} y2={y(g)} stroke="rgba(237,246,240,0.08)" />
            <text x={kiri - 8} y={y(g)} dy="0.32em" textAnchor="end" fontSize="11" fill="#9FBBAE">
              {rpPendek(g)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = kiri + i * slot + (slot - lebarBatang) / 2;
          const h = Math.max(0, (d.nilai / maks) * plotH);
          const dipilih = d.tanggal === terpilih;
          const r = Math.min(4, lebarBatang / 2, h);
          return (
            <g key={d.tanggal}>
              {h > 0 && (
                <path
                  d={`M${x},${atas + plotH} V${atas + plotH - h + r} Q${x},${atas + plotH - h} ${x + r},${atas + plotH - h} H${
                    x + lebarBatang - r
                  } Q${x + lebarBatang},${atas + plotH - h} ${x + lebarBatang},${atas + plotH - h + r} V${atas + plotH} Z`}
                  fill="#FFD447"
                  opacity={hover === null || hover === i ? (dipilih || hover === i ? 1 : 0.8) : 0.35}
                />
              )}
              {dipilih && (
                <rect x={x - 1} y={atas + plotH + 3} width={lebarBatang + 2} height={3} rx={1.5} fill="#FF7A1A" />
              )}
              {(i % tiapLabel === 0 || dipilih) && (
                <text x={x + lebarBatang / 2} y={tinggi - 6} textAnchor="middle" fontSize="11" fill={dipilih ? "#EDF6F0" : "#9FBBAE"}>
                  {d.hari}
                </text>
              )}
              {/* area sentuh lebih besar dari batang */}
              <rect
                x={kiri + i * slot}
                y={atas}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.hari}: ${rp(d.nilai)}`}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => onPilih?.(d.tanggal)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPilih?.(d.tanggal)}
              />
            </g>
          );
        })}
        <line x1={kiri} x2={lebar - kanan} y1={atas + plotH} y2={atas + plotH} stroke="rgba(237,246,240,0.25)" />
      </svg>
      {aktif && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-pitch-950 border border-garis/15 px-3 py-2 text-xs shadow-xl whitespace-nowrap"
          style={{
            left: Math.min(Math.max(kiri + hover * slot + slot / 2, 70), lebar - 70),
            top: Math.max(y(aktif.nilai) - 6, 46),
          }}
        >
          <p className="text-redup">{aktif.label}</p>
          <p className="font-semibold text-garis tabular-nums">{rp(aktif.nilai)}</p>
          <p className="text-redup">{aktif.jumlah} pembayaran</p>
        </div>
      )}
      <table className="sr-only">
        <caption>Uang masuk per hari</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.tanggal}>
              <th>{d.label}</th>
              <td>{rp(d.nilai)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
