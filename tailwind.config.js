/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tajawal", "sans-serif"],
        serif: ["Amiri", "serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#4A5D4E",
          dark: "#3d4d40",
          light: "#D4E2D5",
        },
        earth: {
          DEFAULT: "#8C7E6E",
          dark: "#6B5E4E",
          light: "#F1EFEC",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
