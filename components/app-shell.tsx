"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { useTypingStore } from "@/lib/store";
import { Header } from "./header";
import { Footer } from "./footer";
import { CommandPalette } from "./command-palette";
import { HistoryBackupSync } from "./history-backup-sync";
import { isModalOpen } from "./picker-modal";

/** Chrome shared by every page. Waits for the persisted store so pages never render with default settings. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const hasHydrated = useTypingStore((state) => state.hasHydrated);
  const focusMode = useTypingStore((state) => state.focusMode);
  const reduceMotion = useTypingStore((state) => state.reduceMotion);
  const pathname = usePathname();
  const router = useRouter();
  const [isTyping, setIsTyping] = useState(false);

  // Focus mode: typing on the test page hides the header/footer until the mouse moves
  useEffect(() => {
    if (!focusMode || pathname !== "/") {
      setIsTyping(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !isModalOpen()) {
        setIsTyping(true);
      }
    };
    const onMouseMove = () => setIsTyping(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [focusMode, pathname]);

  // Reduce motion: "auto" follows the OS setting. framer-motion animations are handled by <MotionConfig>,
  // CSS transitions by the .reduce-motion class on <html>.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      document.documentElement.classList.toggle("reduce-motion", reduceMotion === "on" || (reduceMotion === "auto" && media.matches));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [reduceMotion]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ctrl+p toggles the settings page
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        router.push(pathname === "/settings" ? "/" : "/settings");
        return;
      }

      // Esc leaves settings/stats and returns to the test
      if (e.key === "Escape" && pathname !== "/" && !isModalOpen()) {
        router.push("/");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <MotionConfig reducedMotion={reduceMotion === "on" ? "always" : reduceMotion === "off" ? "never" : "user"}>
      <HistoryBackupSync />
      <div className={`transition-opacity duration-300 ${isTyping ? "opacity-0 pointer-events-none" : ""}`}>
        <Header />
        <Footer />
      </div>
      <main className="min-h-screen">{children}</main>
      <CommandPalette />
    </MotionConfig>
  );
}

/** Layout for full-screen content pages (settings, stats): clears the fixed header/footer and scrolls normally. */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto px-6 pt-28 pb-28">{children}</div>;
}
