export interface Theme {
  name: string;
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  correct: string;
  incorrect: string;
  extra: string;
  caret: string;
  sub: string;
}

export const themes: Record<string, Theme> = {
  // Default vibrant theme
  aurora: {
    name: "Aurora",
    background: "#0a0a12",
    foreground: "#e8e6f0",
    primary: "#c879ff",
    secondary: "#15152a",
    correct: "#e8e6f0",
    incorrect: "#ff6b8a",
    extra: "#ff4d6d",
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
    incorrect: "#ff0066",
    extra: "#ff3385",
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
    incorrect: "#ff3366",
    extra: "#cc2952",
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
    incorrect: "#ff5252",
    extra: "#cc4141",
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
    incorrect: "#e57373",
    extra: "#c55a5a",
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
    incorrect: "#ca4754",
    extra: "#7e2a33",
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
    incorrect: "#ff5555",
    extra: "#ff79c6",
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
    incorrect: "#f92672",
    extra: "#fd971f",
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
    incorrect: "#bf616a",
    extra: "#d08770",
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
    incorrect: "#fe4450",
    extra: "#fede5d",
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
    incorrect: "#f7768e",
    extra: "#ff9e64",
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
    incorrect: "#f38ba8",
    extra: "#fab387",
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
    incorrect: "#ff4757",
    extra: "#ffa502",
    caret: "#00d9ff",
    sub: "#5c5c7a"
  },
  matrix: {
    name: "Matrix",
    background: "#0d0208",
    foreground: "#00ff41",
    primary: "#00ff41",
    secondary: "#003b00",
    correct: "#00ff41",
    incorrect: "#ff0040",
    extra: "#008f11",
    caret: "#00ff41",
    sub: "#008f11"
  },
  rose_pine: {
    name: "Rose Pine",
    background: "#191724",
    foreground: "#e0def4",
    primary: "#eb6f92",
    secondary: "#26233a",
    correct: "#e0def4",
    incorrect: "#eb6f92",
    extra: "#f6c177",
    caret: "#eb6f92",
    sub: "#6e6a86"
  },
  gruvbox: {
    name: "Gruvbox",
    background: "#282828",
    foreground: "#ebdbb2",
    primary: "#fabd2f",
    secondary: "#3c3836",
    correct: "#ebdbb2",
    incorrect: "#fb4934",
    extra: "#fe8019",
    caret: "#fabd2f",
    sub: "#665c54"
  }
};

export type ThemeKey = keyof typeof themes;
