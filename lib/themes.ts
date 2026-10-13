/** Monkeytype-style theme: a handful of flat colors, everything else is derived from these. */
export interface Theme {
  name: string;
  /** page background */
  bg: string;
  /** accent: active options, wpm, highlights */
  main: string;
  caret: string;
  /** muted text: untyped letters, labels, inactive buttons */
  sub: string;
  /** secondary surface: buttons, panels, selected rows */
  subAlt: string;
  /** typed text and primary text */
  text: string;
  error: string;
  /** extra letters typed past the end of a word */
  errorExtra: string;
}

export const themes = {
  penguin: {
    name: "Penguin",
    bg: "#393c41",
    main: "#f5a524",
    caret: "#f5a524",
    sub: "#7f838b",
    subAlt: "#2f3236",
    text: "#f4f4f5",
    error: "#e5534b",
    errorExtra: "#9e3a35",
  },
  penguin_light: {
    name: "Penguin Light",
    bg: "#e9eaec",
    main: "#e08a0b",
    caret: "#e08a0b",
    sub: "#9a9ea6",
    subAlt: "#dcdee1",
    text: "#26282c",
    error: "#d1352c",
    errorExtra: "#8f2520",
  },
  serika_dark: {
    name: "Serika Dark",
    bg: "#323437",
    main: "#e2b714",
    caret: "#e2b714",
    sub: "#646669",
    subAlt: "#2c2e31",
    text: "#d1d0c5",
    error: "#ca4754",
    errorExtra: "#7e2a33",
  },
  serika: {
    name: "Serika",
    bg: "#e1e1e3",
    main: "#e2b714",
    caret: "#e2b714",
    sub: "#aaaeb3",
    subAlt: "#d1d3d8",
    text: "#323437",
    error: "#da3333",
    errorExtra: "#791717",
  },
  nord: {
    name: "Nord",
    bg: "#2e3440",
    main: "#88c0d0",
    caret: "#d8dee9",
    sub: "#616e88",
    subAlt: "#3b4252",
    text: "#d8dee9",
    error: "#bf616a",
    errorExtra: "#d08770",
  },
  nord_light: {
    name: "Nord Light",
    bg: "#eceff4",
    main: "#5e81ac",
    caret: "#5e81ac",
    sub: "#8a94a6",
    subAlt: "#e0e5ed",
    text: "#2e3440",
    error: "#bf616a",
    errorExtra: "#d08770",
  },
  catppuccin_mocha: {
    name: "Catppuccin Mocha",
    bg: "#1e1e2e",
    main: "#cba6f7",
    caret: "#f5e0dc",
    sub: "#6c7086",
    subAlt: "#181825",
    text: "#cdd6f4",
    error: "#f38ba8",
    errorExtra: "#eba0ac",
  },
  catppuccin_macchiato: {
    name: "Catppuccin Macchiato",
    bg: "#24273a",
    main: "#c6a0f6",
    caret: "#f4dbd6",
    sub: "#6e738d",
    subAlt: "#1e2030",
    text: "#cad3f5",
    error: "#ed8796",
    errorExtra: "#ee99a0",
  },
  catppuccin_frappe: {
    name: "Catppuccin Frappé",
    bg: "#303446",
    main: "#ca9ee6",
    caret: "#f2d5cf",
    sub: "#737994",
    subAlt: "#292c3c",
    text: "#c6d0f5",
    error: "#e78284",
    errorExtra: "#ea999c",
  },
  catppuccin_latte: {
    name: "Catppuccin Latte",
    bg: "#eff1f5",
    main: "#8839ef",
    caret: "#dc8a78",
    sub: "#9ca0b0",
    subAlt: "#e6e9ef",
    text: "#4c4f69",
    error: "#d20f39",
    errorExtra: "#e64553",
  },
  dracula: {
    name: "Dracula",
    bg: "#282a36",
    main: "#bd93f9",
    caret: "#f8f8f2",
    sub: "#6272a4",
    subAlt: "#21222c",
    text: "#f8f8f2",
    error: "#ff5555",
    errorExtra: "#ffb86c",
  },
  tokyo_night: {
    name: "Tokyo Night",
    bg: "#1a1b26",
    main: "#7aa2f7",
    caret: "#c0caf5",
    sub: "#565f89",
    subAlt: "#16161e",
    text: "#c0caf5",
    error: "#f7768e",
    errorExtra: "#ff9e64",
  },
  tokyo_night_light: {
    name: "Tokyo Night Light",
    bg: "#e1e2e7",
    main: "#2e7de9",
    caret: "#3760bf",
    sub: "#8990b3",
    subAlt: "#d0d5e3",
    text: "#3760bf",
    error: "#f52a65",
    errorExtra: "#b15c00",
  },
  rose_pine: {
    name: "Rosé Pine",
    bg: "#191724",
    main: "#ebbcba",
    caret: "#e0def4",
    sub: "#6e6a86",
    subAlt: "#1f1d2e",
    text: "#e0def4",
    error: "#eb6f92",
    errorExtra: "#f6c177",
  },
  rose_pine_moon: {
    name: "Rosé Pine Moon",
    bg: "#232136",
    main: "#ea9a97",
    caret: "#e0def4",
    sub: "#6e6a86",
    subAlt: "#2a273f",
    text: "#e0def4",
    error: "#eb6f92",
    errorExtra: "#f6c177",
  },
  rose_pine_dawn: {
    name: "Rosé Pine Dawn",
    bg: "#faf4ed",
    main: "#d7827e",
    caret: "#575279",
    sub: "#9893a5",
    subAlt: "#f2e9e1",
    text: "#575279",
    error: "#b4637a",
    errorExtra: "#ea9d34",
  },
  gruvbox_dark: {
    name: "Gruvbox Dark",
    bg: "#282828",
    main: "#d79921",
    caret: "#ebdbb2",
    sub: "#665c54",
    subAlt: "#1d2021",
    text: "#ebdbb2",
    error: "#fb4934",
    errorExtra: "#cc241d",
  },
  gruvbox_light: {
    name: "Gruvbox Light",
    bg: "#fbf1c7",
    main: "#b57614",
    caret: "#3c3836",
    sub: "#a89984",
    subAlt: "#ebdbb2",
    text: "#3c3836",
    error: "#9d0006",
    errorExtra: "#cc241d",
  },
  monokai: {
    name: "Monokai",
    bg: "#272822",
    main: "#a6e22e",
    caret: "#f8f8f2",
    sub: "#75715e",
    subAlt: "#1e1f1c",
    text: "#f8f8f2",
    error: "#f92672",
    errorExtra: "#fd971f",
  },
} satisfies Record<string, Theme>;

export type ThemeKey = keyof typeof themes;

export const DEFAULT_THEME: ThemeKey = "penguin";

/** Old theme keys that were renamed. Removed themes fall back to the default. */
export const LEGACY_THEME_KEYS: Record<string, ThemeKey> = {
  catppuccin: "catppuccin_mocha",
};

/** CSS variables exposed on <html>; Tailwind maps them to bg-bg, text-main, text-sub, bg-sub-alt, etc. */
export function themeCssVars(theme: Theme): Record<string, string> {
  return {
    "--bg": theme.bg,
    "--main": theme.main,
    "--caret": theme.caret,
    "--sub": theme.sub,
    "--sub-alt": theme.subAlt,
    "--text": theme.text,
    "--error": theme.error,
    "--error-extra": theme.errorExtra,
  };
}
