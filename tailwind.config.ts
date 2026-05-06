import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-quantico)', 'sans-serif'],
        headline: ['var(--font-orbitron)', 'sans-serif'],
        'greek-display': ['var(--font-jura)', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        altar: "hsl(var(--input-altar))",
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '0.7',
            filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.4))',
          },
          '50%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))',
           },
        },
        'pulse-glow-cyan': {
          '0%, 100%': {
            opacity: '0.5',
            filter: 'drop-shadow(0 0 2px hsl(var(--primary) / 0.4))',
          },
          '50%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 5px hsl(var(--primary) / 0.8))',
          },
        },
        'max-glitch': {
          '0%':   { transform: 'none',                              opacity: '1',   filter: 'none' },
          '4%':   { transform: 'translateX(-5px) skewX(-4deg)',     opacity: '0.7', filter: 'brightness(2) saturate(3) hue-rotate(15deg)' },
          '8%':   { transform: 'translateX(5px)  skewX(4deg)',      opacity: '1',   filter: 'brightness(0.5)' },
          '12%':  { transform: 'translateX(-8px)',                  opacity: '0.5', filter: 'brightness(2.5) hue-rotate(-20deg)' },
          '16%':  { transform: 'translateX(8px)  skewX(-2deg)',     opacity: '1',   filter: 'none' },
          '20%':  { transform: 'translateX(-3px)',                  opacity: '0.8', filter: 'brightness(1.6) saturate(2)' },
          '24%':  { transform: 'translateX(3px)  skewX(2deg)',      opacity: '1',   filter: 'brightness(0.6)' },
          '28%':  { transform: 'none',                              opacity: '0.6', filter: 'brightness(3) hue-rotate(30deg)' },
          '32%':  { transform: 'translateX(-6px) skewX(-3deg)',     opacity: '1',   filter: 'none' },
          '36%':  { transform: 'translateX(6px)',                   opacity: '0.8', filter: 'brightness(1.4)' },
          '40%':  { transform: 'none',                              opacity: '1',   filter: 'none' },
          '100%': { transform: 'none',                              opacity: '1',   filter: 'none' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'pulse-glow-cyan': 'pulse-glow-cyan 3s ease-in-out infinite',
        'max-glitch': 'max-glitch 0.45s steps(1) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
