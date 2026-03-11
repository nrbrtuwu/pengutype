"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Trash2 } from "lucide-react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { getLanguageDisplayName, LanguageKey } from "@/lib/words";

type BucketCell = {
  tests: number;
  bestWpm: number;
  avgAccuracy: number;
};

export function StatsPanel() {
  const {
    gameMode,
    showStatsPanel,
    setShowStatsPanel,
    results,
    spellLadderResults,
    language,
    theme,
    clearHistory
  } = useTypingStore();

  const currentTheme = themes[theme];
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>(language);
  const [selectedGameMode, setSelectedGameMode] = useState<"normal" | "spell-ladder">(gameMode);

  const timeOptions = [15, 30, 60, 120] as const;
  const wordOptions = [10, 25, 50, 100] as const;
  const gameModeOptions: { key: "normal" | "spell-ladder"; label: string }[] = [
    { key: "normal", label: "normal" },
    { key: "spell-ladder", label: "spell ladder" },
  ];

  useEffect(() => {
    if (showStatsPanel) {
      setSelectedLanguage(language);
      setSelectedGameMode(gameMode);
    }
  }, [showStatsPanel, language, gameMode]);

  useEffect(() => {
    if (!showStatsPanel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowStatsPanel(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showStatsPanel, setShowStatsPanel]);

  const availableLanguages = useMemo(() => {
    const languagesWithResults = Array.from(
      new Set([
        ...results.map((result) => result.language),
        ...spellLadderResults.map((result) => result.language),
      ])
    ) as LanguageKey[];

    if (languagesWithResults.length === 0) {
      return [language];
    }

    if (!languagesWithResults.includes(language)) {
      return [language, ...languagesWithResults];
    }

    return languagesWithResults;
  }, [results, spellLadderResults, language]);

  useEffect(() => {
    if (availableLanguages.length === 0) return;
    if (!availableLanguages.includes(selectedLanguage)) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [availableLanguages, selectedLanguage]);

  const bucketMap = useMemo(() => {
    const map = new Map<string, { tests: number; bestWpm: number; totalAccuracy: number }>();

    results.forEach((result) => {
      const option = result.mode === "time" ? (result.timeOption ?? result.time) : (result.wordOption ?? null);
      if (option === null || option === undefined) return;

      const key = `${result.mode}|${result.language}|${option}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          tests: 1,
          bestWpm: result.wpm,
          totalAccuracy: result.accuracy
        });
        return;
      }

      existing.tests += 1;
      existing.totalAccuracy += result.accuracy;
      existing.bestWpm = Math.max(existing.bestWpm, result.wpm);
    });

    return map;
  }, [results]);

  const getCell = (mode: "time" | "words", option: number): BucketCell | null => {
    const key = `${mode}|${selectedLanguage}|${option}`;
    const bucket = bucketMap.get(key);

    if (!bucket) {
      return null;
    }

    return {
      tests: bucket.tests,
      bestWpm: bucket.bestWpm,
      avgAccuracy: Math.round(bucket.totalAccuracy / bucket.tests)
    };
  };

  const renderModeCard = (mode: "time" | "words") => {
    const options = mode === "time" ? timeOptions : wordOptions;
    const optionLabel = mode === "time" ? "seconds" : "words";

    return (
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: `${currentTheme.background}aa`,
          border: `1px solid ${currentTheme.sub}22`
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {options.map((option) => {
            const cell = getCell(mode, option);

            return (
              <div key={`${mode}-${option}`} className="px-2 py-1">
                <div className="text-xs mb-2" style={{ color: currentTheme.sub }}>
                  {option} {optionLabel}
                </div>
                <div className="text-5xl font-mono leading-none" style={{ color: currentTheme.foreground }}>
                  {cell ? cell.bestWpm : "--"}
                </div>
                <div className="text-4xl font-mono leading-none" style={{ color: currentTheme.foreground }}>
                  {cell ? `${cell.avgAccuracy}%` : "--"}
                </div>
                <div className="text-xs mt-1" style={{ color: currentTheme.sub }}>
                  {cell ? `${cell.tests} test${cell.tests > 1 ? "s" : ""}` : "no tests"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const singleSpellStats = useMemo(() => {
    const singleCompletedRuns = spellLadderResults.filter(
      (result) =>
        result.language === selectedLanguage &&
        result.repeatMode === "single" &&
        result.isCompleted &&
        result.isValid
    );

    if (singleCompletedRuns.length === 0) {
      return null;
    }

    const fastestTime = Math.min(...singleCompletedRuns.map((result) => result.elapsedSeconds));

    return {
      fastestTime,
      tests: singleCompletedRuns.length,
    };
  }, [selectedLanguage, spellLadderResults]);

  const infiniteSpellStatsByLimit = useMemo(() => {
    const map = new Map<number, { bestWords: number; tests: number }>();

    spellLadderResults.forEach((result) => {
      if (result.language !== selectedLanguage || result.repeatMode !== "infinite" || !result.isValid) {
        return;
      }

      const existing = map.get(result.timeOption);
      if (!existing) {
        map.set(result.timeOption, { bestWords: result.completedWords, tests: 1 });
        return;
      }

      existing.tests += 1;
      existing.bestWords = Math.max(existing.bestWords, result.completedWords);
    });

    return map;
  }, [selectedLanguage, spellLadderResults]);

  return (
    <AnimatePresence>
      {showStatsPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ backgroundColor: `${currentTheme.background}cc` }}
            onClick={() => setShowStatsPanel(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed inset-x-4 top-16 bottom-6 md:inset-x-10 md:top-20 md:bottom-10 z-50 rounded-3xl glass-strong overflow-hidden"
          >
            <div className="h-full overflow-y-auto p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BarChart3 size={22} style={{ color: currentTheme.primary }} />
                  <h2 className="text-2xl font-bold" style={{ color: currentTheme.foreground }}>
                    statistics
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {results.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("are you sure you want to clear all history?")) {
                          clearHistory();
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-sm flex items-center gap-2"
                      style={{ backgroundColor: `${currentTheme.sub}22`, color: currentTheme.sub }}
                    >
                      <Trash2 size={14} />
                      clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowStatsPanel(false)}
                    className="p-2 rounded-xl"
                    style={{ color: currentTheme.sub, backgroundColor: `${currentTheme.sub}11` }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {availableLanguages.map((lang) => {
                  const active = selectedLanguage === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        color: active ? currentTheme.background : currentTheme.foreground,
                        backgroundColor: active ? currentTheme.primary : `${currentTheme.sub}22`
                      }}
                    >
                      {getLanguageDisplayName(lang)}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {gameModeOptions.map((modeOption) => {
                  const active = selectedGameMode === modeOption.key;
                  return (
                    <button
                      key={modeOption.key}
                      onClick={() => setSelectedGameMode(modeOption.key)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        color: active ? currentTheme.background : currentTheme.foreground,
                        backgroundColor: active ? currentTheme.primary : `${currentTheme.sub}22`
                      }}
                    >
                      {modeOption.label}
                    </button>
                  );
                })}
              </div>

              {selectedGameMode === "normal" ? (
                <>
                  <section className="mb-5">
                    {renderModeCard("time")}
                  </section>

                  <section>
                    {renderModeCard("words")}
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        backgroundColor: `${currentTheme.background}aa`,
                        border: `1px solid ${currentTheme.sub}22`
                      }}
                    >
                      <div className="text-xs mb-2 tracking-wider" style={{ color: currentTheme.sub }}>
                        spell ladder • single repeat
                      </div>
                      <div className="text-5xl font-mono leading-none" style={{ color: currentTheme.foreground }}>
                        {singleSpellStats ? `${singleSpellStats.fastestTime.toFixed(2)}s` : "--"}
                      </div>
                      <div className="text-xs mt-2" style={{ color: currentTheme.sub }}>
                        fastest completed time (all time limits) {singleSpellStats ? `• ${singleSpellStats.tests} test${singleSpellStats.tests > 1 ? "s" : ""}` : "• no tests"}
                      </div>
                    </div>
                  </section>

                  <section className="mt-5">
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        backgroundColor: `${currentTheme.background}aa`,
                        border: `1px solid ${currentTheme.sub}22`
                      }}
                    >
                      <div className="text-xs mb-4 tracking-wider" style={{ color: currentTheme.sub }}>
                        spell ladder • infinite repeat
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {timeOptions.map((option) => {
                          const stat = infiniteSpellStatsByLimit.get(option);

                          return (
                            <div key={`spell-infinite-${option}`} className="px-2 py-1">
                              <div className="text-xs mb-2" style={{ color: currentTheme.sub }}>
                                {option} seconds
                              </div>
                              <div className="text-5xl font-mono leading-none" style={{ color: currentTheme.foreground }}>
                                {stat ? stat.bestWords : "--"}
                              </div>
                              <div className="text-xs mt-1" style={{ color: currentTheme.sub }}>
                                {stat ? `${stat.tests} test${stat.tests > 1 ? "s" : ""}` : "no tests"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
