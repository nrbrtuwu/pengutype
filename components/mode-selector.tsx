"use client";

import { useTypingStore, TestMode, TIME_OPTIONS, WORD_OPTIONS } from "@/lib/store";
import { themes } from "@/lib/themes";
import { Timer, Type } from "lucide-react";
import { RailDivider, RailGroup, RailOption, RailRestart, SideRail } from "./side-rail";

const modeIcons = {
  time: Timer,
  words: Type
};

export function ModeSelector() {
  const {
    mode,
    setMode,
    timeOption,
    setTimeOption,
    wordOption,
    setWordOption,
    isTestActive,
    isTestComplete,
    theme,
    restartKeybind,
    resetTest
  } = useTypingStore();

  const currentTheme = themes[theme];

  if (isTestActive || isTestComplete) {
    return null;
  }

  return (
    <SideRail>
      <RailGroup theme={currentTheme}>
        {(["time", "words"] as TestMode[]).map((m) => {
          const Icon = modeIcons[m];
          const isActive = mode === m;

          return (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                resetTest();
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isActive ? `${currentTheme.primary}22` : "transparent",
                border: isActive ? `1px solid ${currentTheme.primary}44` : "1px solid transparent",
              }}
              title={m}
            >
              <Icon size={18} style={{ color: isActive ? currentTheme.primary : currentTheme.sub }} />
            </button>
          );
        })}
      </RailGroup>

      <RailDivider theme={currentTheme} />

      <RailGroup theme={currentTheme}>
        {mode === "time"
          ? TIME_OPTIONS.map((t) => (
              <RailOption key={t} active={timeOption === t} onClick={() => setTimeOption(t)} theme={currentTheme}>
                {t}
              </RailOption>
            ))
          : WORD_OPTIONS.map((w) => (
              <RailOption key={w} active={wordOption === w} onClick={() => setWordOption(w)} theme={currentTheme}>
                {w}
              </RailOption>
            ))}
      </RailGroup>

      <RailDivider theme={currentTheme} />

      <RailRestart onClick={resetTest} restartKeybind={restartKeybind} theme={currentTheme} />
    </SideRail>
  );
}
