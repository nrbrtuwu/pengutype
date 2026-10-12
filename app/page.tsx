"use client";

import type { CSSProperties } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TypingTest } from "@/components/typing-test";
import { SettingsPanel } from "@/components/settings-panel";
import { CommandPalette } from "@/components/command-palette";
import { StatsPanel } from "@/components/stats-panel";
import { AnimatedBackground } from "@/components/animated-background";
import { HistoryBackupSync } from "@/components/history-backup-sync";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";

export default function Home() {
  const { theme, hasHydrated } = useTypingStore();

  if (!hasHydrated) {
    return null;
  }

  const currentTheme = themes[theme];

  // Expose theme colors as CSS variables so components can use them in classes (e.g. hover states)
  const themeVars = {
    "--theme-bg": currentTheme.background,
    "--theme-fg": currentTheme.foreground,
    "--theme-primary": currentTheme.primary,
    "--theme-sub": currentTheme.sub,
  } as CSSProperties;

  return (
    <main
      className="min-h-screen transition-colors duration-500 relative overflow-hidden"
      style={{ backgroundColor: currentTheme.background, ...themeVars }}
    >
      <AnimatedBackground />
      <HistoryBackupSync />

      <Header />
      <TypingTest />
      <Footer />
      <SettingsPanel />
      <StatsPanel />
      <CommandPalette />
    </main>
  );
}
