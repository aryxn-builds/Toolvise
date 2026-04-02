import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "media",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        serif: ["var(--font-serif)", ...defaultTheme.fontFamily.serif],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
        heading: ["var(--font-heading)", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'nav': '0 1px 8px rgba(0,0,0,0.03)',
        'btn-hover': '0 4px 12px rgba(249, 115, 22, 0.2)',
      },
      colors: {
        amber: {
          100: "var(--primary-light)",
          200: "var(--primary-muted)",
          300: "var(--primary-muted)",
          400: "var(--primary)",
          500: "var(--primary)",
          600: "var(--primary-hover)",
          700: "var(--primary-hover)",
          800: "var(--dark-80)",
          900: "var(--dark)",
        },
        neutral: {
          100: "var(--neutral-lightest)",
          200: "var(--neutral-lighter)",
          300: "var(--neutral-lighter)",
          400: "var(--neutral-light)",
          500: "var(--neutral)",
          600: "var(--neutral)",
          700: "var(--dark-60)",
          800: "var(--dark-80)",
          900: "var(--dark)",
        },
        brand: {
          primary: "var(--primary)",
          secondary: "var(--primary-light)", 
          accent: "var(--primary-muted)",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          surface: "var(--bg-surface)",
          subtle: "var(--bg-surface)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
