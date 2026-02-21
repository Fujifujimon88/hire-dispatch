/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "#b8963e",
          light: "#d4af5e",
          50: "#f8f6f0",
          100: "#f0ead6",
        },
        navy: {
          DEFAULT: "#1a1a2e",
          light: "#16213e",
          dark: "#0f0f1a",
        },
        status: {
          pending: "#f39c12",
          confirmed: "#3498db",
          dispatched: "#8e44ad",
          completed: "#27ae60",
          cancelled: "#c0392b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #b8963e, #d4af5e)",
        "navy-gradient": "linear-gradient(135deg, #1a1a2e, #16213e)",
        "hero-gradient": "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)",
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "'Helvetica Neue'", "Arial", "sans-serif"],
        serif: ["'Noto Serif JP'", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 4px 16px rgba(184,150,62,0.3)",
        "gold-lg": "0 6px 20px rgba(184,150,62,0.4)",
        header: "0 2px 20px rgba(0,0,0,0.3)",
        card: "0 2px 12px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
