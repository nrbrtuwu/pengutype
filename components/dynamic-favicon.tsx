"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { FAVICON_LINK_ID, faviconHrefs } from "@/lib/favicon";

export function DynamicFavicon() {
  const theme = useTypingStore((state) => state.theme);

  useEffect(() => {
    const link = document.getElementById(FAVICON_LINK_ID) as HTMLLinkElement | null;
    if (link) link.href = faviconHrefs[theme];
  }, [theme]);

  return null;
}
