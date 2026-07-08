/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0B0F19",
          900: "#0F1524",
          800: "#161D2E",
          700: "#212A3F",
          600: "#333F5C",
        },
        accent: {
          DEFAULT: "#6C5CE7",
          light: "#8B7CF6",
          dark: "#5443C9",
        },
        mint: "#2DD4BF",
        amber: "#F5A524",
        coral: "#F0576B",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(108,92,231,0.25), 0 8px 30px rgba(108,92,231,0.15)",
      },
    },
  },
  plugins: [],
};
