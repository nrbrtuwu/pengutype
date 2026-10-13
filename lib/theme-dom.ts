import { themes, themeCssVars, LEGACY_THEME_KEYS, DEFAULT_THEME, type ThemeKey } from "./themes";

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

export const defaultThemeStyle = themeDom[DEFAULT_THEME].vars;

/**
 * Inline script for <head>: applies the saved theme (and its favicon) before first paint so there's no flash of the
 * default theme. The favicon <link> is created here rather than rendered by React, which would duplicate it.
 */
export const themeBootScript = `(() => {
  try {
    const themes = ${JSON.stringify(themeDom)};
    const legacy = ${JSON.stringify(LEGACY_THEME_KEYS)};
    let key = JSON.parse(localStorage.getItem('pengutype-storage'))?.state?.theme;
    key = legacy[key] ?? key;
    const theme = themes[key] ?? themes['${DEFAULT_THEME}'];
    for (const name in theme.vars) document.documentElement.style.setProperty(name, theme.vars[name]);
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = theme.favicon;
    document.head.appendChild(link);
  } catch {}
})();`;
