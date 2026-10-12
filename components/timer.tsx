"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { calculateCharacterStats, calculatePerformanceStats, calculateSeparatorStats } from "@/lib/typing-metrics";
import { Zap, Target, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function Timer() {
  const {
    mode,
    timeOption,
    timeLeft,
    isTestActive,
    isTestComplete,
    startTime,
    updateTimeLeft,
    theme,
    currentWordIndex,
    typedChars,
    words
  } = useTypingStore();

  const currentTheme = themes[theme];

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
    const characterStats = calculateCharacterStats(words, typedChars);
    const separatorStats = calculateSeparatorStats(words, typedChars, currentWordIndex);
    ({ wpm: liveWPM, accuracy: liveAccuracy } = calculatePerformanceStats(characterStats, (Date.now() - startTime) / 1000, 100, {
      additionalCorrectChars: separatorStats.correctSeparators,
      additionalTypedChars: separatorStats.typedSeparators,
    }));
  }

  // Progress percentage for time mode
  const progress = mode === "time" ? ((timeOption - timeLeft) / timeOption) * 100 : 0;
  const isLowTime = timeLeft <= 10 && mode === "time";

  if (!isTestActive || isTestComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      {/* Progress bar for time mode */}
      {mode === "time" && (
        <div 
          className="relative h-1 rounded-full mb-6 overflow-hidden" 
          style={{ backgroundColor: `${currentTheme.sub}33` }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.caret})`,
              boxShadow: `0 0 10px ${currentTheme.primary}66`
            }}
          />
        </div>
      )}

      {/* Stats display */}
      <div className="flex items-center justify-center gap-4">
        {/* Timer / Time remaining */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
            border: `1px solid ${isLowTime ? currentTheme.incorrect : currentTheme.sub}33`,
            boxShadow: isLowTime ? `0 0 15px ${currentTheme.incorrect}33` : 'none',
          }}
        >
          <Clock 
            size={18} 
            style={{ color: isLowTime ? currentTheme.incorrect : currentTheme.primary }} 
          />
          <span
            className="text-2xl font-mono font-bold tabular-nums min-w-[50px] text-center"
            style={{ 
              color: isLowTime ? currentTheme.incorrect : currentTheme.primary,
            }}
          >
            {mode === "time" ? timeLeft : `${currentWordIndex}/${words.length}`}
          </span>
          <span className="text-xs font-medium" style={{ color: currentTheme.sub }}>
            {mode === "time" ? "s" : ""}
          </span>
        </div>

        {/* Live WPM */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
            border: `1px solid ${currentTheme.sub}22`,
          }}
        >
          <Zap size={18} style={{ color: currentTheme.foreground }} />
          <span
            className="text-2xl font-mono font-bold tabular-nums min-w-[40px] text-center"
            style={{ color: currentTheme.foreground }}
          >
            {liveWPM}
          </span>
          <span className="text-xs font-medium" style={{ color: currentTheme.sub }}>
            wpm
          </span>
        </div>

        {/* Live Accuracy */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
            border: `1px solid ${currentTheme.sub}22`,
          }}
        >
          <Target size={18} style={{ color: liveAccuracy < 90 ? currentTheme.incorrect : currentTheme.foreground }} />
          <span
            className="text-2xl font-mono font-bold tabular-nums min-w-[50px] text-center"
            style={{ color: liveAccuracy < 90 ? currentTheme.incorrect : currentTheme.foreground }}
          >
            {liveAccuracy}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
