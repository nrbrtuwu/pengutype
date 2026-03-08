"use client";

import { useEffect, useRef, useMemo } from "react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { Zap, Target, Clock } from "lucide-react";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!isTestActive || mode !== "time" || isTestComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, timeOption - elapsed);
        updateTimeLeft(remaining);
      }
    }, 250); // Reduced frequency for better performance

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTestActive, mode, timeOption, startTime, updateTimeLeft, isTestComplete]);

  // Calculate live WPM - memoized
  const liveWPM = useMemo(() => {
    if (!isTestActive || !startTime) return 0;
    
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    if (elapsed < 0.01) return 0;

    let correctChars = 0;
    typedChars.forEach((wordChars) => {
      wordChars.forEach((char) => {
        if (char.correct && !char.extra) {
          correctChars++;
        }
      });
    });

    correctChars += Math.max(0, currentWordIndex);

    return Math.round((correctChars / 5) / elapsed);
  }, [isTestActive, startTime, typedChars, currentWordIndex]);

  // Calculate live accuracy - memoized
  const liveAccuracy = useMemo(() => {
    let correct = 0;
    let total = 0;

    typedChars.forEach((wordChars) => {
      wordChars.forEach((char) => {
        total++;
        if (char.correct && !char.extra) {
          correct++;
        }
      });
    });

    if (total === 0) return 100;
    return Math.round((correct / total) * 100);
  }, [typedChars]);

  // Progress percentage for time mode
  const progress = mode === "time" ? ((timeOption - timeLeft) / timeOption) * 100 : 0;
  const isLowTime = timeLeft <= 10 && mode === "time";

  if (!isTestActive || isTestComplete) return null;

  return (
    <div className="mb-8">
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
    </div>
  );
}
