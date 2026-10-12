import { themes } from "./themes";

export const FAVICON_LINK_ID = "theme-favicon";

function faviconHref(color: string) {
  const svg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg"><rect width="180" height="180" rx="36" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Favicon data URL for every theme: a rounded square in the theme's primary color. */
export const faviconHrefs: Record<string, string> = Object.fromEntries(
  Object.entries(themes).map(([key, theme]) => [key, faviconHref(theme.primary)])
);
