/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#20d9df",
        "background-light": "#f6f8f8",
        "background-dark": "#112021",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2c2e",
        "text-main": "#0e1a1b",
        "text-sub": "#509395",
        "border-light": "#e8f2f3",
        "border-dark": "#2a3f41",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"]
      },
    },
  },
  plugins: [],
}