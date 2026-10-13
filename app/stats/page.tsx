"use client";

import { useMemo, useState } from "react";
import { useTypingStore, TIME_OPTIONS, WORD_OPTIONS, type GameMode, type TestResult } from "@/lib/store";
import { getBucketKey } from "@/lib/results";
import { getLanguageDisplayName, type LanguageKey } from "@/lib/words";
import { PageContainer } from "@/components/app-shell";

const GAME_MODE_OPTIONS: { key: GameMode; label: string }[] = [
  { key: "normal", label: "normal" },
  { key: "spell-ladder", label: "spell ladder" },
];

const RECENT_LIMIT = 10;

const testsLabel = (count: number) => `${count} test${count === 1 ? "" : "s"}`;
const average = (values: number[]) => (values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);

function Tabs<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (key: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            value === option.key ? "bg-main text-bg" : "bg-sub-alt text-sub hover:text-text"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Overview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-sub">{label}</div>
      <div className="text-4xl md:text-5xl font-mono text-main">{value}</div>
    </div>
  );
}

function BestCell({ label, value, secondary, footnote }: { label: string; value: string; secondary?: string; footnote: string }) {
  return (
    <div>
      <div className="text-xs text-sub mb-2">{label}</div>
      <div className="text-4xl font-mono leading-none text-text">{value}</div>
      {secondary !== undefined && <div className="text-xl font-mono mt-1 text-sub">{secondary}</div>}
      <div className="text-xs mt-2 text-sub">{footnote}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg p-6 bg-sub-alt">
      <h3 className="text-sm mb-5 text-sub">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{children}</div>
    </section>
  );
}

function formatTestType(result: TestResult) {
  return result.mode === "time" ? `time ${result.timeOption ?? Math.round(result.time)}` : `words ${result.wordOption ?? ""}`;
}

export default function StatsPage() {
  const { gameMode, results, spellLadderResults, language } = useTypingStore();

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>(language);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(gameMode);

  // The current language plus every language with recorded results
  const availableLanguages = useMemo(
    () => [...new Set([language, ...results.map((r) => r.language), ...spellLadderResults.map((r) => r.language)])],
    [results, spellLadderResults, language]
  );

  const bucketMap = useMemo(() => {
    const map = new Map<string, { tests: number; bestWpm: number; totalAccuracy: number }>();

    for (const result of results) {
      const key = getBucketKey(result);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { tests: 1, bestWpm: result.wpm, totalAccuracy: result.accuracy });
      } else {
        existing.tests += 1;
        existing.totalAccuracy += result.accuracy;
        existing.bestWpm = Math.max(existing.bestWpm, result.wpm);
      }
    }

    return map;
  }, [results]);

  const languageResults = results.filter((r) => r.language === selectedLanguage);
  const recentResults = [...results].sort((a, b) => b.timestamp - a.timestamp).slice(0, RECENT_LIMIT);

  const ladderRuns = spellLadderResults.filter((r) => r.language === selectedLanguage && r.isValid);
  const singleRuns = ladderRuns.filter((r) => r.repeatMode === "single" && r.isCompleted);
  const fastestSingle = singleRuns.length > 0 ? Math.min(...singleRuns.map((r) => r.elapsedSeconds)) : null;

  const renderBests = (mode: "time" | "words") =>
    (mode === "time" ? TIME_OPTIONS : WORD_OPTIONS).map((option) => {
      const bucket = bucketMap.get(getBucketKey({ mode, language: selectedLanguage, timeOption: option, wordOption: option, time: option }));
      return (
        <BestCell
          key={`${mode}-${option}`}
          label={`${option} ${mode === "time" ? "seconds" : "words"}`}
          value={bucket ? String(bucket.bestWpm) : "-"}
          secondary={bucket ? `${Math.round(bucket.totalAccuracy / bucket.tests)}% acc` : undefined}
          footnote={bucket ? testsLabel(bucket.tests) : "no tests"}
        />
      );
    });

  return (
    <PageContainer>
      <h1 className="text-3xl text-text mb-10">statistics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
        <Overview label="tests completed" value={String(results.length + spellLadderResults.length)} />
        <Overview label="highest wpm" value={results.length > 0 ? String(Math.max(...results.map((r) => r.wpm))) : "-"} />
        <Overview label="average wpm" value={String(average(results.map((r) => r.wpm)) ?? "-")} />
        <Overview label="average accuracy" value={results.length > 0 ? `${average(results.map((r) => r.accuracy))}%` : "-"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl text-sub">personal bests</h2>
        <div className="flex flex-wrap gap-4">
          <Tabs
            options={availableLanguages.map((key) => ({ key, label: getLanguageDisplayName(key).toLowerCase() }))}
            value={selectedLanguage}
            onChange={setSelectedLanguage}
          />
          <Tabs options={GAME_MODE_OPTIONS} value={selectedGameMode} onChange={setSelectedGameMode} />
        </div>
      </div>

      <div className="space-y-4 mb-14">
        {selectedGameMode === "normal" ? (
          <>
            <Card title={`time · ${testsLabel(languageResults.filter((r) => r.mode === "time").length)}`}>{renderBests("time")}</Card>
            <Card title={`words · ${testsLabel(languageResults.filter((r) => r.mode === "words").length)}`}>{renderBests("words")}</Card>
          </>
        ) : (
          <>
            <Card title="single ladder">
              <BestCell
                label="fastest completion"
                value={fastestSingle !== null ? `${fastestSingle.toFixed(2)}s` : "-"}
                footnote={singleRuns.length > 0 ? testsLabel(singleRuns.length) : "no tests"}
              />
            </Card>
            <Card title="endless ladders · most words">
              {TIME_OPTIONS.map((option) => {
                const runs = ladderRuns.filter((r) => r.repeatMode === "infinite" && r.timeOption === option);
                return (
                  <BestCell
                    key={option}
                    label={`${option} seconds`}
                    value={runs.length > 0 ? String(Math.max(...runs.map((r) => r.completedWords))) : "-"}
                    footnote={runs.length > 0 ? testsLabel(runs.length) : "no tests"}
                  />
                );
              })}
            </Card>
          </>
        )}
      </div>

      <h2 className="text-2xl text-sub mb-6">recent tests</h2>
      {recentResults.length === 0 ? (
        <p className="text-sub">no tests yet. go type something!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm whitespace-nowrap">
            <thead className="text-sub">
              <tr>
                {["wpm", "raw", "acc", "chars", "test", "language", "date"].map((heading) => (
                  <th key={heading} className="font-normal px-4 py-2">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-text">
              {recentResults.map((result, index) => (
                <tr key={`${result.timestamp}-${index}`} className={index % 2 === 0 ? "bg-sub-alt" : ""}>
                  <td className="px-4 py-2.5 rounded-l-lg text-main">{result.wpm}</td>
                  <td className="px-4 py-2.5">{result.rawWpm}</td>
                  <td className="px-4 py-2.5">{result.accuracy}%</td>
                  <td className="px-4 py-2.5 text-sub">
                    {result.correctChars}/{result.incorrectChars}/{result.extraChars}/{result.missedChars}
                  </td>
                  <td className="px-4 py-2.5">{formatTestType(result)}</td>
                  <td className="px-4 py-2.5">{result.language.replaceAll("_", " ")}</td>
                  <td className="px-4 py-2.5 rounded-r-lg text-sub">{new Date(result.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
