/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Hijau lapangan malam hari (latar dan permukaan)
        pitch: {
          950: "#06231C",
          900: "#0A2E25",
          800: "#0F3D31",
          700: "#16513F",
          600: "#1F6B54",
        },
        // Putih garis lapangan (teks utama) dan versi redupnya
        garis: "#EDF6F0",
        redup: "#9FBBAE",
        // Oranye rompi latihan (aksi utama)
        rompi: {
          300: "#FFB57A",
          400: "#FF9440",
          500: "#FF7A1A",
          600: "#E66305",
        },
        // Kuning bola (sorotan angka)
        bola: "#FFD447",
        // Dipertahankan agar kelas lama tetap berlaku
        lapangan: {
          50: "#eefbf0",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
      },
      fontFamily: {
        sans: ['"Barlow"', "system-ui", "sans-serif"],
        display: ['"Barlow Condensed"', '"Barlow"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
