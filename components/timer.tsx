"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { calculateCharacterStats, calculatePerformanceStats, calculateSeparatorStats } from "@/lib/typing-metrics";

export function Timer() {
  const {
    mode,
    timeOption,
    timeLeft,
    isTestActive,
    isTestComplete,
    startTime,
    updateTimeLeft,
    currentWordIndex,
    typedChars,
    words,
    showLiveTimer,
    showLiveWpm,
    showLiveAccuracy,
  } = useTypingStore();

  // Timer countdown
  useEffect(() => {
    if (!isTestActive || mode !== "time" || isTestComplete || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      updateTimeLeft(Math.max(0, timeOption - elapsed));
    }, 250);

    return () => clearInterval(interval);
  }, [isTestActive, mode, timeOption, startTime, updateTimeLeft, isTestComplete]);

  // Recomputed on every keypress and timer tick
  let liveWPM = 0;
  let liveAccuracy = 100;
  if (isTestActive && startTime) {
    const characterStats = calculateCharacterStats(words, typedChars, currentWordIndex);
    const separatorStats = calculateSeparatorStats(words, typedChars, currentWordIndex);
    ({ wpm: liveWPM, accuracy: liveAccuracy } = calculatePerformanceStats(characterStats, (Date.now() - startTime) / 1000, 100, {
      additionalCorrectChars: separatorStats.correctSeparators,
      additionalTypedChars: separatorStats.typedSeparators,
    }));
  }

  if (isTestComplete) return null;

  // Always reserve the row so the words don't jump when the test starts
  return (
    <div className="mb-4 h-10 flex items-end gap-6 px-4 font-mono text-main">
      {isTestActive && (
        <>
          {showLiveTimer && <span className="text-3xl">{mode === "time" ? timeLeft : `${currentWordIndex}/${words.length}`}</span>}
          {showLiveWpm && <span className="text-xl text-sub">{liveWPM} wpm</span>}
          {showLiveAccuracy && <span className="text-xl text-sub">{liveAccuracy}%</span>}
        </>
      )}
    </div>
  );
}
