import type { TestResult } from "./store";

type ResultLike = { mode: string; language: string; timeOption?: number; wordOption?: number; time: number };

/** Stats bucket: one personal best per mode + language + duration/word count. */
export function getBucketKey(result: ResultLike): string {
  if (result.mode === "time") {
    return `${result.mode}|${result.language}|${result.timeOption ?? result.time}`;
  }

  return `${result.mode}|${result.language}|${result.wordOption ?? ""}`;
}

/** Key used to track which results were uploaded. Format must stay stable: it's stored in localStorage and the DB. */
export function getSyncKey(result: TestResult): string {
  return [
    result.timestamp,
    result.mode,
    result.language,
    result.timeOption ?? "",
    result.wordOption ?? "",
    result.wpm,
    result.rawWpm,
    result.accuracy,
    result.correctChars,
    result.incorrectChars,
    result.extraChars,
    result.missedChars,
    result.time
  ].join("|");
}

function isBetterResult(candidate: TestResult, current: TestResult): boolean {
  return (
    candidate.wpm - current.wpm ||
    candidate.rawWpm - current.rawWpm ||
    candidate.accuracy - current.accuracy ||
    candidate.timestamp - current.timestamp
  ) > 0;
}

export function getBestResults(results: TestResult[]): TestResult[] {
  const map = new Map<string, TestResult>();

  for (const result of results) {
    const key = getBucketKey(result);
    const existing = map.get(key);
    if (!existing || isBetterResult(result, existing)) {
      map.set(key, result);
    }
  }

  return [...map.values()];
}
