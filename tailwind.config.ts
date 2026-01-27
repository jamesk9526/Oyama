import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1rem' }],      // 12px
        body: ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
        emphasis: ['1rem', { lineHeight: '1.5rem' }],      // 16px
        h3: ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
        h2: ['1.5rem', { lineHeight: '2rem' }],            // 24px
        h1: ['2rem', { lineHeight: '2.5rem' }],            // 32px
      },
      colors: {
        // Dark-first color system
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",
        secondary: "rgb(var(--secondary))",
        "secondary-foreground": "rgb(var(--secondary-foreground))",
        accent: "rgb(var(--accent))",
        "accent-foreground": "rgb(var(--accent-foreground))",
        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        destructive: "rgb(var(--destructive))",
        "destructive-foreground": "rgb(var(--destructive-foreground))",
        // Status colors
        success: "rgb(var(--success))",
        "success-foreground": "rgb(var(--success-foreground))",
        warning: "rgb(var(--warning))",
        "warning-foreground": "rgb(var(--warning-foreground))",
        error: "rgb(var(--error))",
        "error-foreground": "rgb(var(--error-foreground))",
        // Surface color
        surface: "rgb(var(--surface))",
        "surface-foreground": "rgb(var(--surface-foreground))",
      },
      borderRadius: {
        tight: "0.25rem",     // 4px
        standard: "0.5rem",   // 8px
        relaxed: "0.75rem",   // 12px
        prominent: "1rem",    // 16px
        // Legacy aliases
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        // Layout dimensions
        sidebar: "var(--sidebar-width)",
        "context-panel": "var(--context-panel-width)",
        topbar: "var(--topbar-height)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "slide-out-right": "slide-out-right 0.2s ease-in",
        "zen-breathe": "zen-breathe 4s ease-in-out infinite",
        "zen-fade-in": "zen-fade-in 0.4s ease-out",
        "zen-glow": "zen-glow 3s ease-in-out infinite",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "confetti": "confetti 0.3s ease-out",
      },
      keyframes: {
        confetti: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
