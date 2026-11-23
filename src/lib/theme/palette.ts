export const palettes = {
  light: {
    background: "#f5f7fb",
    foreground: "#18243a",
    surface: "#ffffff",
    "surface-muted": "#f8faff",
    muted: "#64748b",
    line: "#e6ebf2",
    brand: "#2563eb",
    "brand-ink": "#1d4ed8",
    "brand-soft": "#edf3ff",
    sidebar: "#ffffff",
    "hero-start": "#193c9a",
    "hero-end": "#2563eb",
  },
  dark: {
    background: "#0b1120",
    foreground: "#e8eef8",
    surface: "#131d30",
    "surface-muted": "#172338",
    muted: "#a3b3cc",
    line: "#2a3851",
    brand: "#7aa2ff",
    "brand-ink": "#a9c2ff",
    "brand-soft": "#20345b",
    sidebar: "#101a2c",
    "hero-start": "#152b59",
    "hero-end": "#254d9a",
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
