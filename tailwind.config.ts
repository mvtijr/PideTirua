import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tirua: {
          ocean: "#0A3656",
          wave: "#0284C7",
          sand: "#FBF7F0",
          terracotta: "#EA580C",
          forest: "#047857",
        },
      },
    },
  },
  plugins: [],
};

export default config;
