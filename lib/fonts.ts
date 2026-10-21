/** Selectable app fonts. The font files are loaded in app/fonts.ts; each one exposes its CSS variable. */
export type FontKey = "jetbrains_mono" | "fira_code" | "roboto_mono" | "source_code_pro" | "ibm_plex_mono" | "space_mono";

export const FONTS: Record<FontKey, { name: string; cssVar: string }> = {
  jetbrains_mono: { name: "JetBrains Mono", cssVar: "--font-jetbrains" },
  fira_code: { name: "Fira Code", cssVar: "--font-fira-code" },
  roboto_mono: { name: "Roboto Mono", cssVar: "--font-roboto-mono" },
  source_code_pro: { name: "Source Code Pro", cssVar: "--font-source-code-pro" },
  ibm_plex_mono: { name: "IBM Plex Mono", cssVar: "--font-ibm-plex-mono" },
  space_mono: { name: "Space Mono", cssVar: "--font-space-mono" },
};

export const DEFAULT_FONT: FontKey = "jetbrains_mono";

/** Value for the `--font-app` CSS variable that the whole UI uses. */
export function fontCssValue(key: FontKey): string {
  return `var(${FONTS[key].cssVar})`;
}
