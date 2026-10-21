import { themes, themeCssVars, LEGACY_THEME_KEYS, DEFAULT_THEME, type ThemeKey } from "./themes";
import { FONTS, fontCssValue, type FontKey } from "./fonts";

function faviconHref(color: string) {
  const svg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg"><rect width="180" height="180" rx="36" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type ThemeDom = { vars: Record<string, string>; favicon: string };

const themeDom = Object.fromEntries(
  Object.entries(themes).map(([key, theme]) => [key, { vars: themeCssVars(theme), favicon: faviconHref(theme.main) }])
) as Record<ThemeKey, ThemeDom>;

function apply({ vars, favicon }: ThemeDom) {
  for (const [name, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(name, value);
  }
  setFavicon(favicon);
}

/** Replaces the tab icon. A fresh <link> is used because browsers often ignore href changes on an existing one. */
function setFavicon(href: string) {
  document.querySelectorAll('link[rel~="icon"]').forEach((link) => link.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = href;
  document.head.appendChild(link);
}

export function applyTheme(key: ThemeKey) {
  apply(themeDom[key]);
}

export function applyFont(key: FontKey) {
  document.documentElement.style.setProperty("--font-app", fontCssValue(key));
}

export const defaultThemeStyle = themeDom[DEFAULT_THEME].vars;

/**
 * Inline script for <head>: applies the saved theme (and its favicon) and font before first paint so there's no flash
 * of the defaults. The favicon <link> is created here rather than rendered by React, which would duplicate it.
 * Mirrors ThemeSync: with "follow system theme" on, the light or dark pick wins.
 */
export const themeBootScript = `(() => {
  try {
    const themes = ${JSON.stringify(themeDom)};
    const legacy = ${JSON.stringify(LEGACY_THEME_KEYS)};
    const fonts = ${JSON.stringify(Object.fromEntries(Object.keys(FONTS).map((key) => [key, fontCssValue(key as FontKey)])))};
    const state = JSON.parse(localStorage.getItem('pengutype-storage'))?.state ?? {};
    let key = state.theme;
    if (state.followSystemTheme && state.randomTheme === 'off') {
      key = matchMedia('(prefers-color-scheme: dark)').matches ? state.darkTheme : state.lightTheme;
    }
    key = legacy[key] ?? key;
    if (fonts[state.font]) document.documentElement.style.setProperty('--font-app', fonts[state.font]);
    const theme = themes[key] ?? themes['${DEFAULT_THEME}'];
    for (const name in theme.vars) document.documentElement.style.setProperty(name, theme.vars[name]);
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = theme.favicon;
    document.head.appendChild(link);
  } catch {}
})();`;
