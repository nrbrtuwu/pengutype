"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypingStore } from "@/lib/store";
import { getSpellingChain } from "@/lib/words";
import { useCaretPosition } from "@/hooks/use-caret-position";
import { AnimatedCaret } from "./animated-caret";
import { FunStage } from "./fun-stage";
import { isModalOpen } from "./picker-modal";
import { CaretAnchor } from "./typing-area";
import { CharBreakdown, DetailItem, ModBadges, NewBestCelebration, RestartHint, ResultActions, StatTile } from "./result-parts";

export function SpellingClimb() {
  const {
    language,
    restartKeybind,
    smoothCaret,
    fontSize,
    caretStyle,
    blindMode,
    showLiveTimer,
    timeOption,
    spellingRepeatMode,
    setInvalidationNotice,
    addSpellLadderResult,
    spellLadderResults,
    spellLadderResetRequest,
    mods,
    setSpellLadderStarted,
  } = useTypingStore();
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

    // mod runs are unranked
    if (mods.length > 0) {
      hasRecordedResultRef.current = true;
      return;
    }

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
    mods.length,
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
      const color =
        typedChar === undefined ? "text-sub" : blindMode || typedChar.toLowerCase() === char.toLowerCase() ? "text-text" : "text-error";
      return (
        <span key={index} className={color}>
          {char}
        </span>
      );
    });

    characters.splice(Math.min(typed.length, currentWord.length), 0, <CaretAnchor key="caret-anchor" />);
    return characters;
  }, [currentWord, typed, blindMode]);

  useEffect(() => {
    let isTabDown = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (isModalOpen()) return;

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

        if (mods.includes("sudden-death")) {
          setTyped(nextTyped);
          setIsActive(false);
          setIsComplete(true);
          setIsInvalidated(true);
          setCompletedAt(Date.now());
          setInvalidationNotice("sudden death: wrong letter");
          return;
        }
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
    mods,
    setInvalidationNotice,
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
        <div className="mb-8 h-10 flex items-end justify-center gap-6 font-mono" aria-hidden={!isActive}>
          {isActive && (
            <>
              {showLiveTimer && <span className="text-3xl text-main">{timeLeft}</span>}
              <span className="text-xl text-sub">{completedWords} words</span>
            </>
          )}
        </div>
      )}

      <div className="min-h-[260px] flex flex-col items-center justify-center text-center">
        {isComplete ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="w-full">
            <NewBestCelebration show={isRoundNewBest} burstKey={completedAt} />
            <ModBadges mods={mods} />

            <div className={`grid grid-cols-2 ${isSingleRepeatMode ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6 mb-10`}>
              {isSingleRepeatMode && <StatTile value={`${elapsedSecondsPrecise.toFixed(2)}s`} label="time" />}
              <StatTile value={isSingleRepeatMode ? spellingWpm : completedWords} label={isSingleRepeatMode ? "wpm" : "score"} />
              <StatTile value={`${accuracy}%`} label="acc" accent={false} />
              <StatTile value={incorrectChars} label="mistakes" accent={false} />
            </div>

            <div className={`grid grid-cols-2 ${isSingleRepeatMode ? "md:grid-cols-3" : "md:grid-cols-4"} gap-6 text-center mb-10`}>
              <DetailItem label="mode">spell ladder</DetailItem>
              <DetailItem label="characters">
                <CharBreakdown
                  parts={[
                    { label: "correct", value: correctChars },
                    { label: "incorrect", value: incorrectChars },
                  ]}
                />
              </DetailItem>
              <DetailItem label="language">{language.replaceAll("_", " ")}</DetailItem>
              {!isSingleRepeatMode && <DetailItem label="time">{elapsedSeconds}s</DetailItem>}
            </div>

            <ResultActions onRetry={buildRound} onNext={buildRound} />
            <RestartHint restartKeybind={restartKeybind} />
          </motion.div>
        ) : (
          <FunStage correctWords={completedWords} mistakes={incorrectChars} className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              <div ref={wordsRef} className="relative inline-block">
                {isCaretReady && (
                  <AnimatedCaret caretPosition={caretPosition} smoothCaret={smoothCaret} fontSize={wordFontSize} caretStyle={caretStyle} />
                )}

                <motion.div
                  key={`current-${currentIndex}-${currentWord}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                  className="font-mono leading-none"
                  style={{ fontSize: `${wordFontSize}px` }}
                >
                  {typedDisplay}
                </motion.div>
              </div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`next-${currentIndex}-${nextWord}`}
                data-next-word={(hasNextWord && !mods.includes("hidden")) || undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`mt-6 font-mono text-3xl md:text-4xl text-sub/60 ${hasNextWord && !mods.includes("hidden") ? "" : "invisible"}`}
              >
                {hasNextWord ? nextWord : " "}
              </motion.div>
            </AnimatePresence>
          </FunStage>
        )}
      </div>
    </div>
  );
}
