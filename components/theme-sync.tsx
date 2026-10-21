"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { themes, isLightTheme, type ThemeKey } from "@/lib/themes";
import { applyFont, applyTheme } from "@/lib/theme-dom";

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Themes random theme can pick from: with "follow system theme" on, only ones matching the OS light/dark mode. */
function randomCandidates(followSystemTheme: boolean): ThemeKey[] {
  const keys = Object.keys(themes) as ThemeKey[];
  return followSystemTheme ? keys.filter((key) => isLightTheme(key) !== prefersDark()) : keys;
}

/** Same theme all day: a simple hash of today's date picks it. */
function dailyTheme(candidates: ThemeKey[]): ThemeKey {
  const today = new Date().toISOString().slice(0, 10);
  const hash = [...today].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return candidates[hash % candidates.length];
}

/**
 * Keeps the <html> theme variables, favicon and font in sync with settings, and drives the automatic theme options
 * (follow system theme, random theme per test / per day).
 */
export function ThemeSync() {
  const theme = useTypingStore((state) => state.theme);
  const font = useTypingStore((state) => state.font);
  const followSystemTheme = useTypingStore((state) => state.followSystemTheme);
  const lightTheme = useTypingStore((state) => state.lightTheme);
  const darkTheme = useTypingStore((state) => state.darkTheme);
  const randomTheme = useTypingStore((state) => state.randomTheme);
  const words = useTypingStore((state) => state.words);
  const spellLadderResetRequest = useTypingStore((state) => state.spellLadderResetRequest);
  const setTheme = useTypingStore((state) => state.setTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  // Follow system theme (random theme takes over when it's on)
  useEffect(() => {
    if (!followSystemTheme || randomTheme !== "off") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setTheme(media.matches ? darkTheme : lightTheme);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [followSystemTheme, randomTheme, lightTheme, darkTheme, setTheme]);

  useEffect(() => {
    if (randomTheme === "day") setTheme(dailyTheme(randomCandidates(followSystemTheme)));
  }, [randomTheme, followSystemTheme, setTheme]);

  // A new test (new words or a new spell ladder round) gets a new random theme
  useEffect(() => {
    if (randomTheme !== "test") return;
    const candidates = randomCandidates(followSystemTheme).filter((key) => key !== useTypingStore.getState().theme);
    if (candidates.length > 0) setTheme(candidates[Math.floor(Math.random() * candidates.length)]);
  }, [randomTheme, followSystemTheme, words, spellLadderResetRequest, setTheme]);

  return null;
}
