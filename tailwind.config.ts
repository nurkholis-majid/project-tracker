import type { Config } from "tailwindcss";

/**
 * Palet diturunkan dari brand: navy pekat, biru laut, biru langit, oranye.
 * Tema terang: kertas biru-muda, teks navy, oranye hanya untuk hal yang paling penting.
 * `alert` ditambahkan karena palet aslinya tidak punya warna untuk keadaan
 * negatif (hapus, ditahan, flag FALSE) — tanpa itu, semua peringatan jadi tak terbaca.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:   { 900: "#0D1039", 800: "#161B4F", 700: "#242A6B", 500: "#4B5190", 300: "#9296C2" },
        ocean: { 700: "#0A3566", 600: "#0E4181", 500: "#1A5CA8", 200: "#C3DAF0", 100: "#E4EEF8" },
        sky:   { 600: "#2AA5D6", 500: "#5AC4EC", 400: "#82D0EF", 200: "#C2E8F8", 100: "#E8F7FD" },
        sun:   { 700: "#B96707", 600: "#DE800E", 500: "#F7941D", 300: "#FBC078", 100: "#FEF0DD" },
        alert: { 600: "#C43D4F", 500: "#E05A63", 200: "#F6CFD2", 100: "#FDECEE" },
        mist:  { 600: "#5B6B85", 400: "#8FA0B8", 200: "#D5DFEA", 100: "#EAF0F6", 50: "#F5F8FB" },
        paper: "#F4F8FC",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(13,16,57,.05), 0 10px 30px -18px rgba(13,16,57,.25)",
      },
    },
  },
  plugins: [],
};
export default config;
