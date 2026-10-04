import withMT from "@material-tailwind/react/utils/withMT.js";
/** @type {import('tailwindcss').Config} */
export default withMT({
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
});
