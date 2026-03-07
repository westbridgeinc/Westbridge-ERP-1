/**
 * Design tokens — single source of truth for all visual constants.
 * These mirror the CSS variables in app/globals.css and should be kept in sync.
 * Use in TypeScript contexts (e.g. chart configs, canvas rendering, email templates).
 */
export const tokens = {
  colors: {
    primary: {
      50:  "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
      950: "#082f49",
    },
    neutral: {
      50:  "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
    semantic: {
      success:     "#22c55e",
      successBg:   "#dcfce7",
      warning:     "#f59e0b",
      warningBg:   "#fef3c7",
      error:       "#ef4444",
      errorBg:     "#fee2e2",
      info:        "#6366f1",
      infoBg:      "#eef2ff",
    },
  },

  spacing: {
    xs:  "0.25rem",   //  4px
    sm:  "0.5rem",    //  8px
    md:  "1rem",      // 16px
    lg:  "1.5rem",    // 24px
    xl:  "2rem",      // 32px
    "2xl": "3rem",    // 48px
    "3xl": "4rem",    // 64px
  },

  radii: {
    none: "0",
    sm:   "0.25rem",
    md:   "0.5rem",
    lg:   "0.75rem",
    xl:   "1rem",
    full: "9999px",
  },

  shadows: {
    sm:  "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md:  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg:  "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl:  "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    none: "none",
  },

  typography: {
    fontFamily: {
      sans:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono:  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    },
    fontSize: {
      xs:   "0.75rem",
      sm:   "0.875rem",
      base: "1rem",
      lg:   "1.125rem",
      xl:   "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    lineHeight: {
      tight:  "1.25",
      snug:   "1.375",
      normal: "1.5",
      relaxed:"1.625",
    },
    fontWeight: {
      normal:   "400",
      medium:   "500",
      semibold: "600",
      bold:     "700",
    },
    letterSpacing: {
      tight:  "-0.025em",
      normal: "0em",
      wide:   "0.025em",
    },
  },

  breakpoints: {
    sm:   "640px",
    md:   "768px",
    lg:   "1024px",
    xl:   "1280px",
    "2xl": "1536px",
  },

  animation: {
    duration: {
      fast:   "150ms",
      normal: "300ms",
      slow:   "500ms",
    },
    easing: {
      linear:    "linear",
      easeIn:    "cubic-bezier(0.4, 0, 1, 1)",
      easeOut:   "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring:    "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },
} as const;

export type Tokens = typeof tokens;
