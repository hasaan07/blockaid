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
        bg: { top: "#111827", bottom: "#020617" },
        cyan: { DEFAULT: "#22d3ee" },
        purple: { DEFAULT: "#a855f7", deep: "#9333ea" },
        pink: { DEFAULT: "#f472b6" },
        ink: "#111827",
        body: "#e5e7eb",
        muted: "#9ca3af",
        loginblue: { DEFAULT: "#2563eb", dark: "#1e40af" },
        signupgreen: { DEFAULT: "#16a34a", dark: "#15803d" },
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(34, 211, 238, 0.15)",
        "glow-strong": "0 0 35px rgba(34, 211, 238, 0.4)",
        "glow-purple": "0 0 25px rgba(168, 85, 247, 0.15)",
        "glow-primary": "0 0 25px rgba(34, 211, 238, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
