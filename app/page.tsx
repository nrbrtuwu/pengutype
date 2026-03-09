"use client";

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

  const currentTheme = themes[theme] ?? themes.aurora;

  return (
    <main 
      className="min-h-screen transition-colors duration-500 relative overflow-hidden noise"
      style={{ backgroundColor: currentTheme.background }}
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
