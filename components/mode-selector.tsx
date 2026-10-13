"use client";

import { useTypingStore, TestMode, TIME_OPTIONS, WORD_OPTIONS } from "@/lib/store";
import { Timer, Type } from "lucide-react";
import { RailDivider, RailOption, RailRestart, SideRail } from "./side-rail";

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
    restartKeybind,
    resetTest
  } = useTypingStore();

  if (isTestActive || isTestComplete) {
    return null;
  }

  return (
    <SideRail>
      {(["time", "words"] as TestMode[]).map((m) => {
        const Icon = modeIcons[m];
        return (
          <RailOption
            key={m}
            active={mode === m}
            onClick={() => {
              setMode(m);
              resetTest();
            }}
            title={m}
          >
            <Icon size={16} />
          </RailOption>
        );
      })}

      <RailDivider />

      {mode === "time"
        ? TIME_OPTIONS.map((t) => (
            <RailOption key={t} active={timeOption === t} onClick={() => setTimeOption(t)} title={`${t} seconds`}>
              {t}
            </RailOption>
          ))
        : WORD_OPTIONS.map((w) => (
            <RailOption key={w} active={wordOption === w} onClick={() => setWordOption(w)} title={`${w} words`}>
              {w}
            </RailOption>
          ))}

      <RailDivider />

      <RailRestart onClick={resetTest} restartKeybind={restartKeybind} />
    </SideRail>
  );
}
