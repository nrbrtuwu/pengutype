export interface Theme {
  name: string;
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  correct: string;
  incorrect: string;
  extra: string;
  missing: string;
  caret: string;
  sub: string;
}

const INCORRECT_COLOR = "#bf616a";
const EXTRA_COLOR = "#d08770";
const MISSING_COLOR = "#4c566a";

const baseThemes: Record<string, Omit<Theme, "incorrect" | "extra" | "missing">> = {
  // Default vibrant theme
  aurora: {
    name: "Aurora",
    background: "#0a0a12",
    foreground: "#e8e6f0",
    primary: "#c879ff",
    secondary: "#15152a",
    correct: "#e8e6f0",
    caret: "#c879ff",
    sub: "#4a4a6a"
  },
  cyber: {
    name: "Cyber",
    background: "#0d0d1a",
    foreground: "#00ffcc",
    primary: "#00ffcc",
    secondary: "#1a1a33",
    correct: "#00ffcc",
    caret: "#00ffcc",
    sub: "#336666"
  },
  sunset: {
    name: "Sunset",
    background: "#1a0a1a",
    foreground: "#ffeedd",
    primary: "#ff7b54",
    secondary: "#2a1525",
    correct: "#ffeedd",
    caret: "#ff7b54",
    sub: "#665555"
  },
  ocean: {
    name: "Ocean",
    background: "#0a1520",
    foreground: "#c5e4f3",
    primary: "#4fc3f7",
    secondary: "#102535",
    correct: "#c5e4f3",
    caret: "#4fc3f7",
    sub: "#4a6070"
  },
  forest: {
    name: "Forest",
    background: "#0a1510",
    foreground: "#d4e5d7",
    primary: "#7dcea0",
    secondary: "#122518",
    correct: "#d4e5d7",
    caret: "#7dcea0",
    sub: "#4a6050"
  },
  serika_dark: {
    name: "Serika Dark",
    background: "#323437",
    foreground: "#d1d0c5",
    primary: "#e2b714",
    secondary: "#2c2e31",
    correct: "#d1d0c5",
    caret: "#e2b714",
    sub: "#646669"
  },
  dracula: {
    name: "Dracula",
    background: "#282a36",
    foreground: "#f8f8f2",
    primary: "#bd93f9",
    secondary: "#44475a",
    correct: "#f8f8f2",
    caret: "#bd93f9",
    sub: "#6272a4"
  },
  monokai: {
    name: "Monokai",
    background: "#272822",
    foreground: "#f8f8f2",
    primary: "#f92672",
    secondary: "#3e3d32",
    correct: "#f8f8f2",
    caret: "#f92672",
    sub: "#75715e"
  },
  nord: {
    name: "Nord",
    background: "#2e3440",
    foreground: "#eceff4",
    primary: "#88c0d0",
    secondary: "#3b4252",
    correct: "#eceff4",
    caret: "#88c0d0",
    sub: "#4c566a"
  },
  synthwave: {
    name: "Synthwave",
    background: "#1a1025",
    foreground: "#f0e9e2",
    primary: "#ff7edb",
    secondary: "#2a1840",
    correct: "#f0e9e2",
    caret: "#ff7edb",
    sub: "#72639a"
  },
  tokyo_night: {
    name: "Tokyo Night",
    background: "#1a1b26",
    foreground: "#a9b1d6",
    primary: "#7aa2f7",
    secondary: "#24283b",
    correct: "#a9b1d6",
    caret: "#7aa2f7",
    sub: "#565f89"
  },
  catppuccin: {
    name: "Catppuccin",
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    primary: "#cba6f7",
    secondary: "#313244",
    correct: "#cdd6f4",
    caret: "#cba6f7",
    sub: "#6c7086"
  },
  midnight: {
    name: "Midnight",
    background: "#0f0f1a",
    foreground: "#e0e0e0",
    primary: "#00d9ff",
    secondary: "#1a1a2e",
    correct: "#e0e0e0",
    caret: "#00d9ff",
    sub: "#5c5c7a"
  },
  rose_pine: {
    name: "Rose Pine",
    background: "#191724",
    foreground: "#e0def4",
    primary: "#eb6f92",
    secondary: "#26233a",
    correct: "#e0def4",
    caret: "#eb6f92",
    sub: "#6e6a86"
  }
};

export const themes: Record<string, Theme> = Object.fromEntries(
  Object.entries(baseThemes).map(([key, baseTheme]) => [
    key,
    {
      ...baseTheme,
      incorrect: INCORRECT_COLOR,
      extra: EXTRA_COLOR,
      missing: MISSING_COLOR,
    },
  ])
) as Record<string, Theme>;

export type ThemeKey = keyof typeof themes;
