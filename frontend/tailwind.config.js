/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface": "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "surface-bright": "#fcf9f8",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#404944",
        "inverse-surface": "#313030",
        "inverse-on-surface": "#f3f0ef",
        "outline": "#707974",
        "outline-variant": "#bfc9c3",
        "surface-tint": "#2b6954",
        "primary": "#003527",
        "on-primary": "#ffffff",
        "primary-container": "#064e3b",
        "on-primary-container": "#80bea6",
        "inverse-primary": "#95d3ba",
        "secondary": "#5e5f56",
        "on-secondary": "#ffffff",
        "secondary-container": "#e4e3d7",
        "on-secondary-container": "#64655c",
        "tertiary": "#2c2e2e",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#424445",
        "on-tertiary-container": "#b0b1b1",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#b0f0d6",
        "primary-fixed-dim": "#95d3ba",
        "on-primary-fixed": "#002117",
        "on-primary-fixed-variant": "#0b513d",
        "secondary-fixed": "#e4e3d7",
        "secondary-fixed-dim": "#c7c7bc",
        "on-secondary-fixed": "#1b1c15",
        "on-secondary-fixed-variant": "#46473f",
        "tertiary-fixed": "#e2e2e2",
        "tertiary-fixed-dim": "#c6c6c7",
        "on-tertiary-fixed": "#1a1c1c",
        "on-tertiary-fixed-variant": "#454747",
        "background": "#fcf9f8",
        "on-background": "#1c1b1b",
        "surface-variant": "#e5e2e1"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "base": "8px",
        "gutter": "24px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "card-padding": "32px"
      },
      fontFamily: {
        "headline-lg-mobile": ["Montserrat", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Montserrat", "sans-serif"],
        "display-lg": ["Montserrat", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "headline-md": ["Montserrat", "sans-serif"]
      },
      fontSize: {
        "headline-lg-mobile": ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-lg": ["40px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }]
      }
    }
  },
  plugins: [],
};
