import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindPostcss from "@tailwindcss/postcss";
/** @type {import('postcss-load-config').Config} */
const config = { plugins: [tailwindPostcss(), tailwindcss(), autoprefixer()] };
export default config;