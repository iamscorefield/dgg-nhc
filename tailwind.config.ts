import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dggPurple: "#512D7C",
        dggPurpleDark: "#3E215F",
        dggYellow: "#F2B42C",
        dggDark: "#07020D",
        dggSurface: "#0D0614",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        monoTech: ["Space Grotesk", "monospace"],
        monoNum: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        typewrite: {
          "0%, 100%": { width: "0%" },
          "50%, 90%": { width: "100%" },
        },
        blink: {
          "50%": { borderColor: "transparent" },
        },
        fadeInView: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        typewriter: "typewrite 5s steps(25) infinite, blink 0.5s step-end infinite",
        fadeIn: "fadeInView 0.35s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;