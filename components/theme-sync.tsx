"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { applyTheme } from "@/lib/theme-dom";

/** Keeps the <html> CSS variables and favicon in sync with the selected theme. */
export function ThemeSync() {
  const theme = useTypingStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
