const base = require("@calcom/config/tailwind-preset");
const { purple } = require("tailwindcss/colors");
/** @type {import('tailwindcss').Config} */
let config = {
  ...base,
  content: [
    ...base.content,
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
    "../../packages/app-store/**/{components,pages}/**/*.{js,ts,jsx,tsx}",
  ],

};
config.theme.extend.colors["techiepurple"]="#514684";

module.exports = config;