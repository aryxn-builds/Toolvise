import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
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
        'glow-blue': '0 0 24px rgba(79,142,247,0.25), 0 0 64px rgba(79,142,247,0.08)',
        'glow-cyan': '0 0 24px rgba(0,212,255,0.20), 0 0 64px rgba(0,212,255,0.06)',
        'glow-purple': '0 0 24px rgba(124,58,237,0.20), 0 0 64px rgba(124,58,237,0.06)',
        'glass': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        'card': '0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,142,247,0.15)',
      },
      colors: {
        mm: {
          base:     '#0A0A0A',
          elevated: '#0F0F0F',
          surface:  '#141414',
          card:     '#111111',
          border:   'rgba(255,255,255,0.08)',
          blue:     '#4F8EF7',
          'blue-light': 'rgba(79,142,247,0.12)',
          cyan:     '#00D4FF',
          'cyan-light': 'rgba(0,212,255,0.10)',
          purple:   '#7C3AED',
          'purple-light': 'rgba(124,58,237,0.12)',
          muted:    '#606060',
          dim:      '#A0A0A0',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
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
      },
      borderRadius: {
        'none': '0',
        'sm':   '0.5rem',
        DEFAULT:'0.75rem',
        'md':   '0.875rem',
        'lg':   '1rem',
        'xl':   '1.25rem',
        '2xl':  '1.5rem',
        '3xl':  '2rem',
        'pill': '9999px',
        'card': '1.25rem',
      },
    },
  },
  plugins: [],
};
export default config;
