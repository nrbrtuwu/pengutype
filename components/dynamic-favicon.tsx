"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";

function upsertFavicon(rel: string, href: string) {
  const selector = `link[rel=\"${rel}\"]`;
  let link = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.type = "image/svg+xml";
  link.href = href;
}

function syncAllTabIcons(href: string) {
  const iconLinks = document.head.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple"], link[rel="apple-touch-icon"]'
  );

  iconLinks.forEach((link) => {
    link.type = "image/svg+xml";
    link.href = href;
  });
}

export function DynamicFavicon() {
  const { theme } = useTypingStore();

  useEffect(() => {
    const activeTheme = themes[theme] ?? themes.aurora;
    const primary = activeTheme.primary;

    const svg = `
<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="36" fill="${primary}"/>
</svg>`;

    const href = `data:image/svg+xml,${encodeURIComponent(svg)}#${theme}`;

    upsertFavicon("icon", href);
    upsertFavicon("shortcut icon", href);
    upsertFavicon("apple", href);
    upsertFavicon("apple-touch-icon", href);
    syncAllTabIcons(href);
  }, [theme]);

  return null;
}
