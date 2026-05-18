import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "ma-shan-zheng": ["var(--font-ma-shan-zheng)", "cursive"],
        "noto-serif-sc": ["var(--font-noto-serif-sc)", "serif"],
      }
    }
  },
  plugins: []
};

export default config;
