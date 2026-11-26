export const palettes = {
  light: {
    background: "#f4f6fb",
    foreground: "#0f172a",
    surface: "#ffffff",
    "surface-glass": "rgba(255, 255, 255, 0.84)",
    "surface-muted": "#f8fafc",
    "surface-hover": "#f1f5f9",
    muted: "#64748b",
    line: "#e2e8f0",
    "line-strong": "#cbd5e1",
    brand: "#2563eb",
    "brand-ink": "#1d4ed8",
    "brand-soft": "#eff6ff",
    "brand-border": "#bfdbfe",
    sidebar: "#ffffff",
    "hero-start": "#1e3a8a",
    "hero-end": "#2563eb",
    "shadow-sm": "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
    "shadow-card": "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)",
    "shadow-elevated": "0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
  },
  dark: {
    background: "#090d16",
    foreground: "#f1f5f9",
    surface: "#111827",
    "surface-glass": "rgba(17, 24, 39, 0.82)",
    "surface-muted": "#162033",
    "surface-hover": "#1e293b",
    muted: "#94a3b8",
    line: "#1f2937",
    "line-strong": "#334155",
    brand: "#60a5fa",
    "brand-ink": "#93c5fd",
    "brand-soft": "rgba(59, 130, 246, 0.16)",
    "brand-border": "rgba(96, 165, 250, 0.32)",
    sidebar: "#0d1322",
    "hero-start": "#11224d",
    "hero-end": "#1d4ed8",
    "shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.35)",
    "shadow-card": "0 2px 8px -1px rgba(0, 0, 0, 0.4), 0 1px 3px -1px rgba(0, 0, 0, 0.3)",
    "shadow-elevated": "0 16px 36px -4px rgba(0, 0, 0, 0.55), 0 6px 16px -2px rgba(0, 0, 0, 0.4)",
  },
} as const;

export const themeStyle = Object.entries(palettes)
  .map(
    ([mode, palette]) =>
      (mode === "light" ? ":root" : ":root.dark") +
      "{color-scheme:" +
      mode +
      ";" +
      Object.entries(palette)
        .map(([key, value]) => "--tn-" + key + ":" + value + ";")
        .join("") +
      "}",
  )
  .join("");
