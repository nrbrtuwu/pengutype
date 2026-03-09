"use client";

import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { calculateConsistency, calculatePerformanceStats } from "@/lib/typing-metrics";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronRight, Zap, Target, Gauge, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export function Results() {
  const {
    isTestComplete,
    correctChars,
    incorrectChars,
    extraChars,
    missedChars,
    startTime,
    endTime,
    theme,
    resetTest,
    retryCurrentTest,
    mode,
    language,
    timeOption,
    wordOption,
    words,
    currentWordIndex,
    restartKeybind,
    results,
    currentResult,
    suppressResultRecording,
  } = useTypingStore();

  const currentTheme = themes[theme];
  const [showConfetti, setShowConfetti] = useState(false);

  const latestResult = results[results.length - 1];
  const activeResult = currentResult ?? latestResult;

  const isSameBucket = (result: (typeof results)[number]) => {
    if (result.mode !== mode || result.language !== language) {
      return false;
    }

    if (mode === "time") {
      return (result.timeOption ?? null) === timeOption;
    }

    return (result.wordOption ?? null) === wordOption;
  };

  const previousBestWpm = useMemo(() => {
    const excludeCurrentRecorded =
      currentResult &&
      latestResult &&
      latestResult.timestamp === currentResult.timestamp &&
      latestResult.mode === currentResult.mode &&
      latestResult.language === currentResult.language;

    const historyPool = excludeCurrentRecorded ? results.slice(0, -1) : results;
    const previousInBucket = historyPool.filter(isSameBucket);
    if (previousInBucket.length === 0) {
      return -1;
    }
    return Math.max(...previousInBucket.map((result) => result.wpm));
  }, [results, mode, language, timeOption, wordOption, currentResult, latestResult]);

  const isNewBest = Boolean(
    !suppressResultRecording &&
    activeResult &&
    activeResult.isValid !== false &&
    isSameBucket(activeResult) &&
    activeResult.wpm > previousBestWpm
  );

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => ({
        id: index,
        x: Math.random() * 100,
        drift: (Math.random() - 0.5) * 320,
        rotate: (Math.random() - 0.5) * 720,
        size: 5 + Math.random() * 8,
        delay: Math.random() * 0.45,
        duration: 1.2 + Math.random() * 1.2
      })),
    [activeResult?.timestamp]
  );

  useEffect(() => {
    if (!isNewBest) {
      setShowConfetti(false);
      return;
    }

    setShowConfetti(true);
    const timer = window.setTimeout(() => setShowConfetti(false), 1800);
    return () => window.clearTimeout(timer);
  }, [isNewBest, activeResult?.timestamp]);

  const fallbackTimeElapsed = startTime && endTime ? (endTime - startTime) / 1000 : 0;
  const displayTimeSeconds = activeResult?.time ?? Math.round(fallbackTimeElapsed);
  const formattedDisplayTime = Number.isInteger(displayTimeSeconds)
    ? `${displayTimeSeconds}s`
    : `${displayTimeSeconds.toFixed(2)}s`;

  const computedMetrics = useMemo(() => {
    const performanceStats = calculatePerformanceStats(
      {
        correctChars,
        incorrectChars,
        extraChars,
        missedChars,
      },
      mode === "time" ? timeOption : Math.max(0, fallbackTimeElapsed),
      0
    );

    return performanceStats;
  }, [correctChars, incorrectChars, extraChars, missedChars, mode, timeOption, fallbackTimeElapsed]);

  const wpm = activeResult?.wpm ?? computedMetrics.wpm;
  const rawWpm = activeResult?.rawWpm ?? computedMetrics.rawWpm;
  const accuracy = activeResult?.accuracy ?? computedMetrics.accuracy;

  const testTypeDisplay = mode === "time" ? `time ${timeOption}s` : `words ${wordOption}`;
  const consistency = activeResult?.isValid === false
    ? 0
    : calculateConsistency({ correctChars, incorrectChars, extraChars, missedChars });

  const charBreakdown = {
    correct: correctChars,
    incorrect: incorrectChars,
    extra: extraChars,
    missed: missedChars
  };

  if (!isTestComplete) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showConfetti && (
              <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden">
                {confettiPieces.map((piece) => (
                  <motion.div
                    key={piece.id}
                    className="absolute rounded-[2px]"
                    style={{
                      left: `${piece.x}%`,
                      top: "-10vh",
                      width: piece.size,
                      height: piece.size * 0.65,
                      backgroundColor:
                        piece.id % 3 === 0
                          ? currentTheme.primary
                          : piece.id % 3 === 1
                            ? currentTheme.caret
                            : currentTheme.foreground
                    }}
                    initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
                    animate={{
                      y: "120vh",
                      x: piece.drift,
                      rotate: piece.rotate,
                      opacity: [0, 1, 1, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: piece.duration,
                      delay: piece.delay,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {isNewBest && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-4 text-center"
        >
          <span
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}33, ${currentTheme.caret}33)`,
              color: currentTheme.foreground,
              boxShadow: `0 0 24px ${currentTheme.primary}33`
            }}
          >
            🎉 new best!
          </span>
        </motion.div>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div 
          className="text-center p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
          }}
        >
          <Zap className="mx-auto mb-2" size={24} style={{ color: currentTheme.primary }} />
          <div 
            className="text-5xl md:text-6xl font-mono font-bold"
            style={{ color: currentTheme.primary }}
          >
            {wpm}
          </div>
          <div 
            className="text-sm tracking-wider mt-2 font-medium"
            style={{ color: currentTheme.sub }}
          >
            wpm
          </div>
        </div>

        <div 
          className="text-center p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
          }}
        >
          <Target className="mx-auto mb-2" size={24} style={{ color: currentTheme.foreground }} />
          <div 
            className="text-5xl md:text-6xl font-mono font-bold"
            style={{ color: currentTheme.foreground }}
          >
            {accuracy}%
          </div>
          <div 
            className="text-sm tracking-wider mt-2 font-medium"
            style={{ color: currentTheme.sub }}
          >
            accuracy
          </div>
        </div>

        <div 
          className="text-center p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
          }}
        >
          <Gauge className="mx-auto mb-2" size={24} style={{ color: currentTheme.foreground }} />
          <div 
            className="text-5xl md:text-6xl font-mono font-bold"
            style={{ color: currentTheme.foreground }}
          >
            {rawWpm}
          </div>
          <div 
            className="text-sm tracking-wider mt-2 font-medium"
            style={{ color: currentTheme.sub }}
          >
            raw
          </div>
        </div>

        <div 
          className="text-center p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
          }}
        >
          <TrendingUp className="mx-auto mb-2" size={24} style={{ color: currentTheme.foreground }} />
          <div 
            className="text-5xl md:text-6xl font-mono font-bold"
            style={{ color: currentTheme.foreground }}
          >
            {Math.round(consistency)}%
          </div>
          <div 
            className="text-sm tracking-wider mt-2 font-medium"
            style={{ color: currentTheme.sub }}
          >
            consistency
          </div>
        </div>
      </div>

      {/* Detailed stats */}
      <div 
        className="rounded-2xl p-6 mb-8"
        style={{ 
          backgroundColor: `${currentTheme.background}dd`,
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div 
              className="text-xs tracking-wider mb-2 font-medium"
              style={{ color: currentTheme.sub }}
            >
              test type
            </div>
            <div 
              className="text-lg font-mono font-medium"
              style={{ color: currentTheme.foreground }}
            >
              {testTypeDisplay}
            </div>
          </div>

          <div>
            <div 
              className="text-xs tracking-wider mb-2 font-medium"
              style={{ color: currentTheme.sub }}
            >
              characters
            </div>
            <div className="relative inline-flex group">
              <div className="text-lg font-mono flex items-center gap-1 font-medium cursor-help">
                <span style={{ color: currentTheme.correct }}>{charBreakdown.correct}</span>
                <span style={{ color: currentTheme.sub }}>/</span>
                <span style={{ color: currentTheme.incorrect }}>{charBreakdown.incorrect}</span>
                <span style={{ color: currentTheme.sub }}>/</span>
                <span style={{ color: currentTheme.extra }}>{charBreakdown.extra}</span>
                <span style={{ color: currentTheme.sub }}>/</span>
                <span style={{ color: currentTheme.sub }}>{charBreakdown.missed}</span>
              </div>

              <div
                className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20"
                style={{
                  color: currentTheme.foreground,
                  backgroundColor: `${currentTheme.background}f2`,
                  boxShadow: `0 8px 24px ${currentTheme.background}cc`
                }}
              >
                <div>correct: {charBreakdown.correct}</div>
                <div>incorrect: {charBreakdown.incorrect}</div>
                <div>extra: {charBreakdown.extra}</div>
                <div>missed: {charBreakdown.missed}</div>
              </div>
            </div>
          </div>

          <div>
            <div 
              className="text-xs tracking-wider mb-2 font-medium"
              style={{ color: currentTheme.sub }}
            >
              language
            </div>
            <div 
              className="text-lg font-mono font-medium"
              style={{ color: currentTheme.foreground }}
            >
              {language.toLowerCase()}
            </div>
          </div>

          <div>
            <div 
              className="text-xs tracking-wider mb-2 font-medium"
              style={{ color: currentTheme.sub }}
            >
              time
            </div>
            <div 
              className="text-lg font-mono font-medium"
              style={{ color: currentTheme.foreground }}
            >
              {formattedDisplayTime}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={retryCurrentTest}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            backgroundColor: `${currentTheme.background}dd`,
            color: currentTheme.foreground 
          }}
        >
          <RotateCcw size={18} />
          <span>try again</span>
        </button>

        <button
          onClick={resetTest}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02]"
          style={{ 
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`,
            color: currentTheme.background,
            boxShadow: `0 0 20px ${currentTheme.primary}44`
          }}
        >
          <span>next test</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-8">
        <span 
          className="text-sm font-medium"
          style={{ color: currentTheme.sub }}
        >
          press{" "}
          <kbd 
            className="px-2 py-1 rounded-lg text-xs font-mono font-bold" 
            style={{ backgroundColor: currentTheme.secondary, color: currentTheme.foreground }}
          >
            tab
          </kbd>
          {restartKeybind === "tab-enter" && (
            <>
              {" + "}
              <kbd
                className="px-2 py-1 rounded-lg text-xs font-mono font-bold"
                style={{ backgroundColor: currentTheme.secondary, color: currentTheme.foreground }}
              >
                enter
              </kbd>
            </>
          )}
          {" to restart"}
        </span>
      </div>
    </div>
  );
}
