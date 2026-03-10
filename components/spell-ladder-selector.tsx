"use client";

import { useTypingStore, TimeOption, SpellingRepeatMode } from "@/lib/store";
import { themes } from "@/lib/themes";
import { RotateCcw, Infinity as InfinityIcon, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SpellLadderSelector() {
  const {
    gameMode,
    isTestActive,
    isTestComplete,
    timeOption,
    setTimeOption,
    spellingRepeatMode,
    setSpellingRepeatMode,
    restartKeybind,
    theme,
  } = useTypingStore();

  const currentTheme = themes[theme];
  const timeOptions: TimeOption[] = [15, 30, 60, 120];
  const repeatOptions: { key: SpellingRepeatMode; label: string; isInfinity?: boolean }[] = [
    { key: "single", label: "1" },
    { key: "infinite", label: "∞", isInfinity: true },
  ];
  const restartShortcutLabel = restartKeybind === "tab" ? "tab" : "tab + enter";
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const handleStart = () => setHasStarted(true);
    const handleReset = () => setHasStarted(false);

    window.addEventListener("spell-ladder-start", handleStart as EventListener);
    window.addEventListener("spell-ladder-reset", handleReset as EventListener);

    return () => {
      window.removeEventListener("spell-ladder-start", handleStart as EventListener);
      window.removeEventListener("spell-ladder-reset", handleReset as EventListener);
    };
  }, []);

  if (gameMode !== "spell-ladder" || isTestActive || isTestComplete || hasStarted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3"
    >
      <div
        className="flex flex-col gap-1 p-2 rounded-xl"
        style={{
          backgroundColor: `${currentTheme.background}ee`,
          border: `1px solid ${currentTheme.sub}22`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-center h-8 pointer-events-none" style={{ color: currentTheme.sub }}>
          <Timer size={16} />
        </div>

        {timeOptions.map((t) => {
          const isActive = timeOption === t;
          return (
            <button
              key={t}
              onClick={() => setTimeOption(t)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isActive ? currentTheme.primary : "transparent",
                color: isActive ? currentTheme.background : currentTheme.sub,
                boxShadow: isActive ? `0 0 15px ${currentTheme.primary}44` : "none",
              }}
              title={`${t} seconds`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="w-6 mx-auto h-px" style={{ backgroundColor: `${currentTheme.sub}33` }} />

      <div
        className="flex flex-col gap-1 p-2 rounded-xl"
        style={{
          backgroundColor: `${currentTheme.background}ee`,
          border: `1px solid ${currentTheme.sub}22`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-center h-8 pointer-events-none" style={{ color: currentTheme.sub }}>
          <RotateCcw size={16} />
        </div>

        {repeatOptions.map((option) => {
          const isActive = spellingRepeatMode === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setSpellingRepeatMode(option.key)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isActive ? currentTheme.primary : "transparent",
                color: isActive ? currentTheme.background : currentTheme.sub,
                boxShadow: isActive ? `0 0 15px ${currentTheme.primary}44` : "none",
              }}
              title={option.key === "single" ? "one repeat" : "infinite repeats"}
            >
              {option.isInfinity ? <InfinityIcon size={16} /> : option.label}
            </button>
          );
        })}
      </div>

      <div className="w-6 mx-auto h-px" style={{ backgroundColor: `${currentTheme.sub}33` }} />

      <div
        className="flex flex-col p-2 rounded-xl"
        style={{
          backgroundColor: `${currentTheme.background}ee`,
          border: `1px solid ${currentTheme.sub}22`,
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("spell-ladder-request-reset"))}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 hover:rotate-[-30deg]"
          style={{ color: currentTheme.sub }}
          title={`restart (${restartShortcutLabel})`}
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </motion.div>
  );
}
