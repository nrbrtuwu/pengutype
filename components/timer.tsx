"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { calculateCharacterStats, calculatePerformanceStats, calculateSeparatorStats } from "@/lib/typing-metrics";

// Fail thresholds only kick in after this, so the first few keystrokes can't fail a test
const FAIL_GRACE_SECONDS = 3;

type LiveState = ReturnType<typeof useTypingStore.getState>;

function liveStats({ words, typedChars, currentWordIndex, startTime, rejectedKeys }: LiveState) {
  const characterStats = calculateCharacterStats(words, typedChars, currentWordIndex);
  characterStats.incorrectChars += rejectedKeys;
  const separatorStats = calculateSeparatorStats(words, typedChars, currentWordIndex);
  const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
  const { wpm, accuracy } = calculatePerformanceStats(characterStats, elapsedSeconds, 100, {
    additionalCorrectChars: separatorStats.correctSeparators,
    additionalTypedChars: separatorStats.typedSeparators,
  });
  return { wpm, accuracy, elapsedSeconds };
}

export function Timer() {
  const state = useTypingStore();
  const {
    mode,
    timeOption,
    timeLeft,
    isTestActive,
    isTestComplete,
    startTime,
    updateTimeLeft,
    currentWordIndex,
    words,
    showLiveTimer,
    showLiveWpm,
    showLiveAccuracy,
    showProgressBar,
    minWpm,
    minAccuracy,
  } = state;

  // Timer countdown
  useEffect(() => {
    if (!isTestActive || mode !== "time" || isTestComplete || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      updateTimeLeft(Math.max(0, timeOption - elapsed));
    }, 250);

    return () => clearInterval(interval);
  }, [isTestActive, mode, timeOption, startTime, updateTimeLeft, isTestComplete]);

  // Fail thresholds: checked on an interval so stopping to type (wpm dropping) is caught too
  useEffect(() => {
    if (!isTestActive || isTestComplete || (minWpm <= 0 && minAccuracy <= 0)) return;

    const interval = setInterval(() => {
      const current = useTypingStore.getState();
      if (!current.isTestActive || current.isTestComplete) return;

      const { wpm, accuracy, elapsedSeconds } = liveStats(current);
      if (elapsedSeconds < FAIL_GRACE_SECONDS) return;
      if (minWpm > 0 && wpm < minWpm) current.endTest(`below ${minWpm} wpm`);
      else if (minAccuracy > 0 && accuracy < minAccuracy) current.endTest(`below ${minAccuracy}% accuracy`);
    }, 500);

    return () => clearInterval(interval);
  }, [isTestActive, isTestComplete, minWpm, minAccuracy]);

  if (isTestComplete) return null;

  // Recomputed on every keypress and timer tick
  const live = isTestActive && startTime ? liveStats(state) : { wpm: 0, accuracy: 100 };
  const progress = mode === "time" ? (timeOption - timeLeft) / timeOption : currentWordIndex / Math.max(1, words.length);

  // Always reserve the row so the words don't jump when the test starts
  return (
    <div className="mb-4 px-4">
      <div className="h-10 flex items-end gap-6 font-mono text-main">
        {isTestActive && (
          <>
            {showLiveTimer && <span className="text-3xl">{mode === "time" ? timeLeft : `${currentWordIndex}/${words.length}`}</span>}
            {showLiveWpm && <span className="text-xl text-sub">{live.wpm} wpm</span>}
            {showLiveAccuracy && <span className="text-xl text-sub">{live.accuracy}%</span>}
          </>
        )}
      </div>

      {showProgressBar && (
        <div className="mt-3 h-1 rounded-full bg-sub-alt overflow-hidden">
          <div
            className="h-full bg-main transition-[width] duration-1000 ease-linear"
            style={{ width: `${isTestActive ? Math.min(100, progress * 100) : 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
