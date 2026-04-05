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
        'glow-green':  '0 0 24px rgba(46,160,67,0.22), 0 0 64px rgba(46,160,67,0.07)',
        'glow-teal':   '0 0 24px rgba(26,188,156,0.18), 0 0 64px rgba(26,188,156,0.06)',
        'glow-blue':   '0 0 24px rgba(56,139,253,0.16), 0 0 64px rgba(56,139,253,0.05)',
        'glass':       '0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.09)',
        'card':        '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
        'card-hover':  '0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(46,160,67,0.14)',
        'btn':         '0 4px 12px rgba(46,160,67,0.28), 0 1px 3px rgba(0,0,0,0.30)',
      },
      colors: {
        tv: {
          base:      '#0D1117',
          card:      '#161B22',
          elevated:  '#1C2128',
          green:     '#2EA043',
          'green-hover': '#238636',
          'green-light': 'rgba(46,160,67,0.12)',
          teal:      '#1ABC9C',
          'teal-light': 'rgba(26,188,156,0.10)',
          sky:       '#388BFD',
          'sky-light': 'rgba(56,139,253,0.12)',
          lavender:  '#BC8CFF',
          text:      '#E6EDF3',
          muted:     '#8B949E',
          dim:       '#484F58',
          border:    'rgba(240,246,252,0.10)',
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
