"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Type, Target, AlertCircle } from "lucide-react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { getSpellingChain } from "@/lib/words";
import { useCaretPosition } from "@/hooks/use-caret-position";
import { AnimatedCaret } from "./animated-caret";
import { CharBreakdown, DetailItem, NewBestCelebration, RestartHint, ResultActions, StatTile } from "./result-parts";

export function SpellingClimb() {
  const {
    language,
    theme,
    restartKeybind,
    smoothCaret,
    fontSize,
    timeOption,
    spellingRepeatMode,
    setInvalidationNotice,
    addSpellLadderResult,
    spellLadderResults,
    spellLadderResetRequest,
    setSpellLadderStarted,
  } = useTypingStore();
  const currentTheme = themes[theme];
  const wordsRef = useRef<HTMLDivElement>(null);
  const wordFontSize = Math.max(42, Math.round(fontSize * 3));

  const [wordChain, setWordChain] = useState<string[]>([]);
  const [queuedChain, setQueuedChain] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(timeOption);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [lastInputAt, setLastInputAt] = useState<number | null>(null);
  const [isInvalidated, setIsInvalidated] = useState(false);
  const [completedWords, setCompletedWords] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [singleRunCompleted, setSingleRunCompleted] = useState(false);
  const [isRoundNewBest, setIsRoundNewBest] = useState(false);
  const hasRecordedResultRef = useRef(false);

  const generateChain = useCallback((excludeSignature?: string) => {
    const fallback = ["bee", "need", "needle", "needles"];

    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = getSpellingChain(language, 3);
      const chain = candidate.length > 0 ? candidate : fallback;
      const signature = chain.join("|");

      if (!excludeSignature || signature !== excludeSignature) {
        return chain;
      }
    }

    return fallback;
  }, [language]);

  const buildRound = useCallback(() => {
    const chain = generateChain();
    const nextChain = generateChain(chain.join("|"));

    setWordChain(chain);
    setQueuedChain(nextChain);
    setCurrentIndex(0);
    setTyped("");
    setTimeLeft(timeOption);
    setIsActive(false);
    setIsComplete(false);
    setStartedAt(null);
    setCompletedAt(null);
    setLastInputAt(null);
    setIsInvalidated(false);
    setCompletedWords(0);
    setCorrectChars(0);
    setIncorrectChars(0);
    setSingleRunCompleted(false);
    setIsRoundNewBest(false);
    hasRecordedResultRef.current = false;
    setSpellLadderStarted(false);
  }, [generateChain, timeOption, setSpellLadderStarted]);

  useEffect(() => {
    if (!isComplete || hasRecordedResultRef.current || !startedAt) {
      return;
    }

    const completedTs = completedAt ?? Date.now();
    const elapsedSeconds = Math.max(0.001, (completedTs - startedAt) / 1000);
    const isValidRun = !isInvalidated;
    let shouldCelebrate = false;

    if (spellingRepeatMode === "single") {
      if (singleRunCompleted && isValidRun) {
        const previousFastestTime = spellLadderResults
          .filter(
            (result) =>
              result.language === language &&
              result.repeatMode === "single" &&
              result.isCompleted &&
              result.isValid
          )
          .reduce((best, result) => Math.min(best, result.elapsedSeconds), Number.POSITIVE_INFINITY);

        shouldCelebrate = elapsedSeconds < previousFastestTime;

        addSpellLadderResult({
          repeatMode: "single",
          language,
          timeOption,
          completedWords,
          elapsedSeconds,
          isCompleted: true,
          isValid: true,
          timestamp: completedTs,
        });
      }
    } else if (isValidRun) {
      const previousBestWords = spellLadderResults
        .filter(
          (result) =>
            result.language === language &&
            result.repeatMode === "infinite" &&
            result.isValid &&
            result.timeOption === timeOption
        )
        .reduce((best, result) => Math.max(best, result.completedWords), -1);

      shouldCelebrate = completedWords > previousBestWords;

      addSpellLadderResult({
        repeatMode: "infinite",
        language,
        timeOption,
        completedWords,
        elapsedSeconds,
        isCompleted: false,
        isValid: true,
        timestamp: completedTs,
      });
    }

    setIsRoundNewBest(shouldCelebrate);
    hasRecordedResultRef.current = true;
  }, [
    addSpellLadderResult,
    completedAt,
    completedWords,
    isComplete,
    isInvalidated,
    language,
    spellLadderResults,
    singleRunCompleted,
    spellingRepeatMode,
    startedAt,
    timeOption,
  ]);

  // Also rebuilds when the header logo or selector requests a reset
  useEffect(() => {
    buildRound();
  }, [buildRound, spellLadderResetRequest]);

  useEffect(() => {
    if (!isActive || isComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          setIsActive(false);
          setCompletedAt(Date.now());
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isActive, isComplete]);

  useEffect(() => {
    if (!isActive || isComplete || !lastInputAt) {
      return;
    }

    const interval = window.setInterval(() => {
      if (Date.now() - lastInputAt >= 5000) {
        setIsActive(false);
        setIsComplete(true);
        setIsInvalidated(true);
        setCompletedAt(Date.now());
        setInvalidationNotice("afk detected");
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isActive, isComplete, lastInputAt, setInvalidationNotice]);

  const currentWord = wordChain[currentIndex] ?? "";
  const nextWord =
    currentIndex + 1 < wordChain.length
      ? wordChain[currentIndex + 1]
      : spellingRepeatMode === "infinite"
        ? queuedChain[0] ?? ""
        : "";
  const hasNextWord = nextWord.length > 0;

  const caretTypedChars = useMemo(
    () => [
      currentWord
        .slice(0, typed.length)
        .split("")
        .map((expectedChar, index) => ({
          char: typed[index] ?? "",
          correct: (typed[index] ?? "").toLowerCase() === expectedChar.toLowerCase(),
          extra: false,
        })),
    ],
    [currentWord, typed]
  );

  const { caretPosition, isCaretReady } = useCaretPosition({
    wordsRef,
    fontSize: wordFontSize,
    typedChars: caretTypedChars,
    currentWordIndex: 0,
    words: [currentWord || ""],
  });

  const typedDisplay = useMemo(() => {
    if (!currentWord) return null;

    const characters = currentWord.split("").map((char, index) => {
      const typedChar = typed[index];
      const isTyped = typedChar !== undefined;
      const isCorrect = isTyped && typedChar.toLowerCase() === char.toLowerCase();

      return (
        <span
          key={`char-${index}`}
          style={{
            color: isTyped
              ? isCorrect
                ? currentTheme.primary
                : currentTheme.incorrect
              : currentTheme.missing,
          }}
        >
          {char}
        </span>
      );
    });

    const caretIndex = Math.min(typed.length, currentWord.length);
    characters.splice(
      caretIndex,
      0,
      <span
        key="caret-anchor"
        data-caret-anchor
        aria-hidden
        className="inline-block align-baseline"
        style={{
          width: 0,
          height: "1em",
          margin: 0,
          padding: 0,
          pointerEvents: "none",
        }}
      />
    );
    return characters;
  }, [
    currentWord,
    typed,
    currentTheme.primary,
    currentTheme.incorrect,
    currentTheme.missing,
  ]);

  useEffect(() => {
    let isTabDown = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "Tab") {
        event.preventDefault();
        isTabDown = true;
      }

      if (restartKeybind === "tab" && key === "Tab" && !event.repeat) {
        buildRound();
        return;
      }

      if (restartKeybind === "tab-enter" && key === "Enter" && isTabDown) {
        event.preventDefault();
        buildRound();
        return;
      }

      if (key === "Escape") {
        event.preventDefault();
        buildRound();
        return;
      }

      if (isComplete) {
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        setTyped((prev) => prev.slice(0, -1));
        return;
      }

      if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      event.preventDefault();

      if (!currentWord) {
        return;
      }

      if (typed.length >= currentWord.length) {
        return;
      }

      const nextExpected = currentWord[typed.length];
      if (!nextExpected) {
        return;
      }

      if (!isActive) {
        setIsActive(true);
        const now = Date.now();
        setStartedAt(now);
        setLastInputAt(now);
        setSpellLadderStarted(true);
      } else {
        setLastInputAt(Date.now());
      }

      const nextTyped = `${typed}${key}`;

      const isCorrectPress = key.toLowerCase() === nextExpected.toLowerCase();
      if (isCorrectPress) {
        setCorrectChars((prev) => prev + 1);
      } else {
        setIncorrectChars((prev) => prev + 1);
      }

      if (nextTyped.length < currentWord.length) {
        setTyped(nextTyped);
        return;
      }

      if (nextTyped.toLowerCase() !== currentWord.toLowerCase()) {
        setTyped(nextTyped);
        return;
      }

      setCompletedWords((prev) => prev + 1);

      if (currentIndex + 1 < wordChain.length) {
        setCurrentIndex((prev) => prev + 1);
        setTyped("");
      } else {
        if (spellingRepeatMode === "single") {
          setSingleRunCompleted(true);
          setIsComplete(true);
          setIsActive(false);
          setCompletedAt(Date.now());
        } else {
          const nextChain = queuedChain.length > 0 ? queuedChain : generateChain(wordChain.join("|"));
          const followingChain = generateChain(nextChain.join("|"));

          setWordChain(nextChain);
          setQueuedChain(followingChain);
          setCurrentIndex(0);
          setTyped("");
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        isTabDown = false;
      }
    };

    const handleWindowBlur = () => {
      isTabDown = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [
    buildRound,
    currentIndex,
    currentWord,
    isActive,
    isComplete,
    restartKeybind,
    spellingRepeatMode,
    typed,
    queuedChain,
    generateChain,
    wordChain,
  ]);

  const elapsedSeconds = Math.max(0, timeOption - timeLeft);
  const elapsedSecondsPrecise = useMemo(() => {
    if (!startedAt) {
      return elapsedSeconds;
    }

    const endMs = completedAt ?? Date.now();
    return Math.max(0.001, (endMs - startedAt) / 1000);
  }, [completedAt, elapsedSeconds, startedAt]);
  const totalTypedChars = correctChars + incorrectChars;
  const accuracy = totalTypedChars > 0 ? Math.round((correctChars / totalTypedChars) * 100) : 100;
  const isSingleRepeatMode = spellingRepeatMode === "single";
  const spellingWpm = isInvalidated
    ? 0
    : Math.max(0, Math.round((correctChars / 5) / (elapsedSecondsPrecise / 60)));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!isComplete && (
        <div className="mb-8 h-[56px] flex items-center justify-center" aria-hidden={!isActive}>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center gap-4"
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: `${currentTheme.background}dd`,
                  border: `1px solid ${currentTheme.sub}33`,
                }}
              >
                <Clock3 size={18} style={{ color: currentTheme.primary }} />
                <span className="text-2xl font-mono font-bold" style={{ color: currentTheme.primary }}>
                  {timeLeft}
                </span>
                <span className="text-xs" style={{ color: currentTheme.sub }}>
                  s
                </span>
              </div>

              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: `${currentTheme.background}dd`,
                  border: `1px solid ${currentTheme.sub}22`,
                }}
              >
                <Type size={18} style={{ color: currentTheme.foreground }} />
                <span className="text-2xl font-mono font-bold" style={{ color: currentTheme.foreground }}>
                  {completedWords}
                </span>
                <span className="text-xs" style={{ color: currentTheme.sub }}>
                  words
                </span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="min-h-[260px] flex flex-col items-center justify-center text-center">
        {isComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full"
          >
            <NewBestCelebration show={isRoundNewBest} burstKey={completedAt} theme={currentTheme} />

            <div className={`grid grid-cols-2 ${isSingleRepeatMode ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 mb-8`}>
              {isSingleRepeatMode && (
                <div className="text-center p-6 rounded-2xl" style={{ backgroundColor: `${currentTheme.background}dd` }}>
                  <Clock3 className="mx-auto mb-2" size={24} style={{ color: currentTheme.primary }} />
                  <div
                    className="w-full inline-flex items-baseline justify-center gap-0.5 font-mono font-bold tabular-nums text-4xl md:text-5xl"
                    style={{ color: currentTheme.primary }}
                  >
                    <span>{elapsedSecondsPrecise.toFixed(2)}</span>
                    <span>s</span>
                  </div>
                  <div className="text-sm tracking-wider mt-2 font-medium" style={{ color: currentTheme.primary }}>
                    time
                  </div>
                </div>
              )}

              <StatTile
                icon={Type}
                value={isSingleRepeatMode ? spellingWpm : completedWords}
                label={isSingleRepeatMode ? "wpm" : "score"}
                color={isSingleRepeatMode ? currentTheme.caret : currentTheme.primary}
                labelColor={isSingleRepeatMode ? currentTheme.caret : currentTheme.sub}
                theme={currentTheme}
              />
              <StatTile icon={Target} value={`${accuracy}%`} label="accuracy" color={currentTheme.foreground} theme={currentTheme} />
              <StatTile
                icon={AlertCircle}
                value={incorrectChars}
                label="incorrect letters"
                color={currentTheme.incorrect}
                labelColor={currentTheme.incorrect}
                theme={currentTheme}
              />
            </div>

            <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: `${currentTheme.background}dd` }}>
              <div className={`grid grid-cols-2 ${isSingleRepeatMode ? "md:grid-cols-3" : "md:grid-cols-4"} gap-6 text-center`}>
                <DetailItem label="mode" theme={currentTheme}>spell ladder</DetailItem>
                <DetailItem label="characters" theme={currentTheme}>
                  <CharBreakdown
                    theme={currentTheme}
                    parts={[
                      { label: "correct", value: correctChars, color: currentTheme.correct },
                      { label: "incorrect", value: incorrectChars, color: currentTheme.incorrect },
                    ]}
                  />
                </DetailItem>
                <DetailItem label="language" theme={currentTheme}>{language.toLowerCase()}</DetailItem>
                {!isSingleRepeatMode && <DetailItem label="time" theme={currentTheme}>{elapsedSeconds}s</DetailItem>}
              </div>
            </div>

            <ResultActions onRetry={buildRound} onNext={buildRound} theme={currentTheme} />
            <RestartHint restartKeybind={restartKeybind} theme={currentTheme} />
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <div ref={wordsRef} className="relative inline-block">
                {isCaretReady && (
                  <AnimatedCaret
                    caretPosition={caretPosition}
                    smoothCaret={smoothCaret}
                    fontSize={wordFontSize}
                    theme={theme}
                  />
                )}

                <motion.div
                  key={`current-${currentIndex}-${currentWord}`}
                  initial={{ opacity: 0, y: 24, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="font-mono font-bold tracking-wide leading-none"
                  style={{ color: currentTheme.foreground, fontSize: `${wordFontSize}px` }}
                >
                  {typedDisplay}
                </motion.div>
              </div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`next-${currentIndex}-${nextWord}`}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 0.4, y: 0, scale: 0.86 }}
                exit={{ opacity: 0, y: -8, scale: 0.8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 font-mono text-4xl md:text-5xl font-semibold"
                style={{
                  color: currentTheme.sub,
                  visibility: hasNextWord ? "visible" : "hidden",
                }}
              >
                {hasNextWord ? nextWord : "\u00A0"}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
