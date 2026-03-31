import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        foreground: "#1A1A2E",
        primary: {
          DEFAULT: "#FF6B35",
          hover: "#e05c2e"
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          hover: "#2b2b48"
        },
        accent: "#FFFFFF",
        success: "#4CAF50",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      animation: {
        'sonar': 'sonar 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        sonar: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
