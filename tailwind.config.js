/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#C6A47E",
        sidebar: "#282D32",
      },
    },
  },
  plugins: [],
};
