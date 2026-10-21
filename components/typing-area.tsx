"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { useTypingStore, type IndicateTypos } from "@/lib/store";
import { useCaretPosition } from "@/hooks/use-caret-position";
import { AnimatedCaret } from "./animated-caret";
import { FunStage } from "./fun-stage";
import { Keymap } from "./keymap";
import { PaceCaret } from "./pace-caret";
import { isModalOpen } from "./picker-modal";
import { countCorrectWords } from "@/lib/typing-metrics";
import { getBucketKey } from "@/lib/results";
import { playTypingSound } from "@/lib/sounds";

// Tape mode keeps the caret at this fraction of the line's width
const TAPE_CARET_POSITION = 0.35;
// Average pace uses this many recent results
const PACE_AVERAGE_OF = 10;

export const CaretAnchor = memo(function CaretAnchor() {
  return <span data-caret-anchor aria-hidden className="inline-block align-baseline w-0 h-[1em] pointer-events-none" />;
});

const Word = memo(function Word({
  word,
  wordIndex,
  typedChars,
  currentWordIndex,
  blindMode,
  hidden,
  indicateTypos,
}: {
  word: string;
  wordIndex: number;
  typedChars: { char: string; correct: boolean; extra?: boolean }[];
  currentWordIndex: number;
  /** show typed letters as plain text, hiding mistakes */
  blindMode: boolean;
  /** hidden mod: word is invisible but keeps its space */
  hidden: boolean;
  indicateTypos: IndicateTypos;
}) {
  const isCurrentWord = wordIndex === currentWordIndex;
  const isWordComplete = wordIndex < currentWordIndex;
  const caretIndex = typedChars.length;
  // Finished words with missing letters get an error underline
  const hasMissingChars = !blindMode && isWordComplete && typedChars.length < word.length;

  const letters = word.split("").map((char, charIndex) => {
    const typedChar = typedChars[charIndex];
    const isTypo = typedChar && !typedChar.correct && !blindMode;
    const color = !typedChar ? "text-sub" : isTypo ? "text-error" : "text-text";

    if (isTypo && indicateTypos === "replace") {
      return (
        <span key={charIndex} data-char className={color}>
          {typedChar.char}
        </span>
      );
    }

    return (
      <span key={charIndex} data-char className={`${color} ${isTypo && indicateTypos === "below" ? "relative" : ""}`}>
        {char}
        {isTypo && indicateTypos === "below" && (
          <span className="absolute left-1/2 -translate-x-1/2 top-[1.05em] text-[0.45em] leading-none text-error/80">
            {typedChar.char}
          </span>
        )}
      </span>
    );
  });

  // blind mode hides extra letters, so the caret waits at the end of the word
  if (isCurrentWord && (caretIndex <= word.length || blindMode)) {
    letters.splice(Math.min(caretIndex, word.length), 0, <CaretAnchor key="caret-anchor" />);
  }

  return (
    <span
      data-word
      // the flashlight mod lights this word so you can read ahead, even across a line break
      data-next-word={wordIndex === currentWordIndex + 1 || undefined}
      className={`inline-block ${hidden ? "invisible" : ""} ${hasMissingChars ? "underline decoration-error decoration-2 underline-offset-[0.22em]" : ""}`}
    >
      {letters}

      {!blindMode && typedChars.filter((c) => c.extra).map((typedChar, extraIndex) => (
        <span key={`extra-${extraIndex}`} className="text-error-extra">
          {typedChar.char}
        </span>
      ))}

      {isCurrentWord && caretIndex > word.length && !blindMode && <CaretAnchor key="caret-anchor-after-extra" />}
    </span>
  );
});

/** Target speed for the pace caret, or null when it's off or there's no history to pace against. */
function usePaceWpm(): number | null {
  const { paceCaret, paceCaretWpm, results, mode, language, timeOption, wordOption } = useTypingStore();

  return useMemo(() => {
    if (paceCaret === "off") return null;
    if (paceCaret === "custom") return paceCaretWpm > 0 ? paceCaretWpm : null;

    const bucket = getBucketKey({ mode, language, timeOption, wordOption, time: timeOption });
    const bucketWpms = results.filter((result) => getBucketKey(result) === bucket).map((result) => result.wpm);
    if (bucketWpms.length === 0) return null;
    if (paceCaret === "pb") return Math.max(...bucketWpms);
    const recent = bucketWpms.slice(-PACE_AVERAGE_OF);
    return Math.round(recent.reduce((sum, wpm) => sum + wpm, 0) / recent.length);
  }, [paceCaret, paceCaretWpm, results, mode, language, timeOption, wordOption]);
}

export function TypingArea() {
  const {
    words,
    typedChars,
    currentWordIndex,
    isTestActive,
    isTestComplete,
    startTime,
    handleKeyPress,
    smoothCaret,
    fontSize,
    caretStyle,
    visibleLines,
    blindMode,
    indicateTypos,
    tapeMode,
    showKeymap,
    mods,
  } = useTypingStore();
  const paceWpm = usePaceWpm();
  const reduceMotion = useReducedMotionConfig();

  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const [clipWidth, setClipWidth] = useState(0);
  const effectiveFontSize = Math.round(fontSize * 1.5);
  const lineHeight = effectiveFontSize * 1.6;
  const { caretPosition, isCaretReady } = useCaretPosition({
    wordsRef,
    fontSize: effectiveFontSize,
    typedChars,
    currentWordIndex,
    words,
  });

  // Focus container on mount and after reset
  useEffect(() => {
    containerRef.current?.focus();
  }, [words, isTestComplete]);

  // Tape mode needs the visible width to keep the caret in place
  useEffect(() => {
    const clip = clipRef.current;
    if (!clip) return;
    const observer = new ResizeObserver(() => setClipWidth(clip.clientWidth));
    observer.observe(clip);
    return () => observer.disconnect();
  }, [isTestComplete]);

  // Ensure reset returns viewport to the first line
  useEffect(() => {
    if (!clipRef.current) return;

    const firstWordTypedCount = typedChars[0]?.length || 0;
    if (currentWordIndex === 0 && firstWordTypedCount === 0) {
      clipRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [currentWordIndex, typedChars]);

  // Sounds: react to what the key actually did (typed, mistake, rejected, backspace, space)
  useEffect(
    () =>
      useTypingStore.subscribe((state, prev) => {
        if (state.words !== prev.words) return; // a new test, not a keypress
        if (state.rejectedKeys > prev.rejectedKeys) return playTypingSound(true);
        if (state.typedChars === prev.typedChars && state.currentWordIndex === prev.currentWordIndex) return;

        const now = state.typedChars[state.currentWordIndex] ?? [];
        const before = prev.typedChars[prev.currentWordIndex] ?? [];
        if (state.currentWordIndex === prev.currentWordIndex && now.length > before.length) {
          const typed = now[now.length - 1];
          return playTypingSound(!typed.correct || !!typed.extra);
        }
        playTypingSound(false);
      }),
    []
  );

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTestComplete || isModalOpen()) return;

      const isReloadShortcut = e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
      if (isReloadShortcut) {
        e.preventDefault();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (e.key === "Backspace" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          const currentWordTyped = typedChars[currentWordIndex] || [];
          for (let i = 0; i < currentWordTyped.length; i++) {
            handleKeyPress("Backspace");
          }
        }
        return;
      }

      if (e.key === " " || e.key === "Backspace") {
        e.preventDefault();
      }

      if (e.key === "Tab") {
        e.preventDefault();
        return;
      }

      handleKeyPress(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, isTestComplete, typedChars, currentWordIndex]);

  useEffect(() => {
    const hasProgress = typedChars.some((wordChars) => wordChars.length > 0);
    if (!isTestActive || isTestComplete || !hasProgress) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isTestActive, isTestComplete, typedChars]);

  // Scroll by whole lines so the current line stays put (second line, or first when only 2 are visible)
  useEffect(() => {
    const clip = clipRef.current;
    const currentWordEl = wordsRef.current?.querySelectorAll<HTMLElement>("[data-word]")[currentWordIndex];
    if (tapeMode || !clip || !currentWordEl) return;

    const lineIndex = Math.round(currentWordEl.offsetTop / lineHeight);
    const linesAbove = visibleLines >= 3 ? 1 : 0;
    clip.scrollTo({ top: Math.max(0, lineIndex - linesAbove) * lineHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [currentWordIndex, lineHeight, visibleLines, tapeMode, reduceMotion]);

  if (isTestComplete) {
    return null;
  }

  const mistakes = typedChars.reduce((sum, word) => sum + word.filter((c) => !c.correct || c.extra).length, 0);
  const currentWord = words[currentWordIndex] ?? "";
  const typedInWord = typedChars[currentWordIndex]?.length ?? 0;
  const nextKey = typedInWord < currentWord.length ? currentWord[typedInWord] : " ";
  // Tape mode: slide the whole line so the caret stays at a fixed spot
  const tapeOffset = clipWidth * TAPE_CARET_POSITION - caretPosition.x;

  return (
    <>
      <FunStage correctWords={countCorrectWords(words, typedChars, currentWordIndex)} mistakes={mistakes} className="w-full">
        <div
          ref={containerRef}
          tabIndex={0}
          className="relative outline-none w-full"
          style={{ fontSize: `${effectiveFontSize}px` }}
        >
          {/* Clips to the visible lines (or the single tape line) */}
          <div
            ref={clipRef}
            className="relative overflow-hidden px-4"
            // exactly `visibleLines` lines, so neighboring lines never peek in
            style={{ height: `${(tapeMode ? 1 : visibleLines) * lineHeight}px` }}
          >
            <div
              ref={wordsRef}
              className={`relative leading-relaxed font-mono select-none ${tapeMode ? "w-max" : ""} ${
                tapeMode && !reduceMotion ? "transition-transform duration-150 ease-out" : ""
              }`}
              style={{ lineHeight: `${lineHeight}px`, transform: tapeMode ? `translateX(${tapeOffset}px)` : undefined }}
            >
              {paceWpm !== null && (
                <PaceCaret wordsRef={wordsRef} words={words} startTime={startTime} wpm={paceWpm} fontSize={effectiveFontSize} />
              )}

              {isCaretReady && (
                <AnimatedCaret
                  caretPosition={caretPosition}
                  smoothCaret={smoothCaret}
                  fontSize={effectiveFontSize}
                  caretStyle={caretStyle}
                />
              )}

              {/* Words */}
              <div className={`flex gap-x-3 ${tapeMode ? "flex-nowrap" : "flex-wrap"}`}>
                {words.map((word, wordIndex) => (
                  <Word
                    key={wordIndex}
                    word={word}
                    wordIndex={wordIndex}
                    typedChars={typedChars[wordIndex] || []}
                    currentWordIndex={currentWordIndex}
                    blindMode={blindMode}
                    hidden={mods.includes("hidden") && wordIndex > currentWordIndex + 1}
                    indicateTypos={indicateTypos}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </FunStage>

      {showKeymap && <Keymap nextKey={nextKey} />}
    </>
  );
}
