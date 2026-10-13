"use client";

import { useTypingStore } from "@/lib/store";
import { calculateConsistency } from "@/lib/typing-metrics";
import { getBucketKey } from "@/lib/results";
import { motion } from "framer-motion";
import { CharBreakdown, DetailItem, ModBadges, NewBestCelebration, RestartHint, ResultActions, StatTile } from "./result-parts";

export function Results() {
  const { isTestComplete, currentResult: result, results, restartKeybind, resetTest, retryCurrentTest } = useTypingStore();

  if (!isTestComplete || !result) return null;

  const bucketKey = getBucketKey(result);
  const previousBestWpm = Math.max(
    -1,
    ...results.filter((r) => r !== result && getBucketKey(r) === bucketKey).map((r) => r.wpm)
  );
  // Only results that were recorded (valid, not retry mode) can be a new best
  const isNewBest = results.includes(result) && result.wpm > previousBestWpm;

  const consistency = result.isValid === false ? 0 : calculateConsistency(result);
  const testType = result.mode === "time" ? `time ${result.timeOption}` : `words ${result.wordOption}`;
  const time = Number.isInteger(result.time) ? `${result.time}s` : `${result.time.toFixed(2)}s`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="w-full">
      <NewBestCelebration show={isNewBest} burstKey={result.timestamp} />
      <ModBadges mods={result.mods} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatTile value={result.wpm} label="wpm" />
        <StatTile value={`${result.accuracy}%`} label="acc" />
        <StatTile value={result.rawWpm} label="raw" accent={false} />
        <StatTile value={`${consistency}%`} label="consistency" accent={false} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-10">
        <DetailItem label="test type">{testType}</DetailItem>
        <DetailItem label="characters">
          <CharBreakdown
            parts={[
              { label: "correct", value: result.correctChars },
              { label: "incorrect", value: result.incorrectChars },
              { label: "extra", value: result.extraChars },
              { label: "missed", value: result.missedChars },
            ]}
          />
        </DetailItem>
        <DetailItem label="language">{result.language.replaceAll("_", " ")}</DetailItem>
        <DetailItem label="time">{time}</DetailItem>
      </div>

      <ResultActions onRetry={retryCurrentTest} onNext={resetTest} />
      <RestartHint restartKeybind={restartKeybind} />
    </motion.div>
  );
}
