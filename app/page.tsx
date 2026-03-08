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
import { useEffect, useState } from "react";

export default function Home() {
  const { theme } = useTypingStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use default theme during SSR
  const currentTheme = mounted ? themes[theme] : themes.serika_dark;

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
