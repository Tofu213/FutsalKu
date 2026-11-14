/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        lapangan: {
          50: "#eefbf0",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
      },
    },
  },
  plugins: [],
};
