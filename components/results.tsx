"use client";

import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { calculateConsistency } from "@/lib/typing-metrics";
import { getBucketKey } from "@/lib/results";
import { motion } from "framer-motion";
import { Zap, Target, Gauge, TrendingUp } from "lucide-react";
import { CharBreakdown, DetailItem, NewBestCelebration, RestartHint, ResultActions, StatTile } from "./result-parts";

export function Results() {
  const {
    isTestComplete,
    currentResult: result,
    results,
    theme,
    restartKeybind,
    resetTest,
    retryCurrentTest,
  } = useTypingStore();

  const currentTheme = themes[theme];

  if (!isTestComplete || !result) return null;

  const bucketKey = getBucketKey(result);
  const previousBestWpm = Math.max(
    -1,
    ...results.filter((r) => r !== result && getBucketKey(r) === bucketKey).map((r) => r.wpm)
  );
  // Only results that were recorded (valid, not retry mode) can be a new best
  const isNewBest = results.includes(result) && result.wpm > previousBestWpm;

  const consistency = result.isValid === false ? 0 : calculateConsistency(result);
  const testType = result.mode === "time" ? `time ${result.timeOption}s` : `words ${result.wordOption}`;
  const time = Number.isInteger(result.time) ? `${result.time}s` : `${result.time.toFixed(2)}s`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NewBestCelebration show={isNewBest} burstKey={result.timestamp} theme={currentTheme} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile icon={Zap} value={result.wpm} label="wpm" color={currentTheme.primary} theme={currentTheme} />
        <StatTile icon={Target} value={`${result.accuracy}%`} label="accuracy" color={currentTheme.foreground} theme={currentTheme} />
        <StatTile icon={Gauge} value={result.rawWpm} label="raw" color={currentTheme.foreground} theme={currentTheme} />
        <StatTile icon={TrendingUp} value={`${consistency}%`} label="consistency" color={currentTheme.foreground} theme={currentTheme} />
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: `${currentTheme.background}dd` }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <DetailItem label="test type" theme={currentTheme}>{testType}</DetailItem>
          <DetailItem label="characters" theme={currentTheme}>
            <CharBreakdown
              theme={currentTheme}
              parts={[
                { label: "correct", value: result.correctChars, color: currentTheme.correct },
                { label: "incorrect", value: result.incorrectChars, color: currentTheme.incorrect },
                { label: "extra", value: result.extraChars, color: currentTheme.extra },
                { label: "missed", value: result.missedChars, color: currentTheme.missing },
              ]}
            />
          </DetailItem>
          <DetailItem label="language" theme={currentTheme}>{result.language.toLowerCase()}</DetailItem>
          <DetailItem label="time" theme={currentTheme}>{time}</DetailItem>
        </div>
      </div>

      <ResultActions onRetry={retryCurrentTest} onNext={resetTest} theme={currentTheme} />
      <RestartHint restartKeybind={restartKeybind} theme={currentTheme} />
    </motion.div>
  );
}
