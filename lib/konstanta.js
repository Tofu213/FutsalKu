// Konstanta dan fungsi murni (aman dipakai di server maupun client)

// Batas waktu pelanggan membayar DP setelah booking dibuat (jam)
export const BATAS_DP_JAM = 2;

export const dpDiperlukan = (totalHarga, dpPersen) => Math.ceil((totalHarga * dpPersen) / 100);

// Waktu sekarang dalam WIB (UTC+7): tanggal YYYY-MM-DD dan jam (0-23)
export function sekarangWib(now = new Date()) {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return { tanggal: wib.toISOString().slice(0, 10), jam: wib.getUTCHours() };
}

// Jam yang sudah lewat (jam berjalan masih boleh dipesan)
export function sudahLewat(tanggal, jamMulai, now = new Date()) {
  const s = sekarangWib(now);
  return tanggal < s.tanggal || (tanggal === s.tanggal && jamMulai < s.jam);
}

// Permainan sudah dimulai (tidak dapat dibatalkan lagi)
export function sudahMulai(tanggal, jamMulai, now = new Date()) {
  const s = sekarangWib(now);
  return tanggal < s.tanggal || (tanggal === s.tanggal && jamMulai <= s.jam);
}

// Batas akhir pembayaran DP untuk booking berstatus Menunggu Pembayaran
export const batasBayarDp = (createdAt) => new Date(new Date(createdAt).getTime() + BATAS_DP_JAM * 3600 * 1000);
