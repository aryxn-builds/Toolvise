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
        'soft': '0 2px 20px rgba(82,43,91,0.08), 0 1px 4px rgba(82,43,91,0.04)',
        'medium': '0 8px 32px rgba(82,43,91,0.12), 0 2px 8px rgba(82,43,91,0.06)',
        'strong': '0 16px 48px rgba(43,18,76,0.16), 0 4px 16px rgba(82,43,91,0.08)',
        '3d': '0 4px 0 rgba(43,18,76,0.3), 0 8px 24px rgba(43,18,76,0.15)',
        '3d-hover': '0 2px 0 rgba(43,18,76,0.3), 0 4px 12px rgba(43,18,76,0.15)',
        'card': '0 2px 16px rgba(82,43,91,0.06), 0 1px 4px rgba(82,43,91,0.03)',
        'card-hover': '0 12px 40px rgba(82,43,91,0.14), 0 4px 12px rgba(82,43,91,0.06)',
        'glow': '0 0 32px rgba(133,79,108,0.25)',
        'inner': 'inset 0 2px 8px rgba(82,43,91,0.08)',
      },
      colors: {
        plum: {
          50:  '#FBE4D8',
          100: '#FEF0E8',
          200: '#DFB6B2',
          300: '#C48FA0',
          400: '#854F6C',
          500: '#522B5B',
          600: '#2B124C',
          700: '#190019',
          800: '#150015',
          900: '#0F000F',
        },
        brand: {
          bg:      '#FBE4D8',
          surface: '#FEF0E8',
          card:    '#FFFFFF',
          text:    '#190019',
          muted:   '#854F6C',
          border:  '#DFB6B2',
          primary: '#522B5B',
          accent:  '#854F6C',
          blush:   '#DFB6B2',
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
