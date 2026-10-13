"use client";

import { useEffect, useRef, memo } from "react";
import { useTypingStore } from "@/lib/store";
import { useCaretPosition } from "@/hooks/use-caret-position";
import { AnimatedCaret } from "./animated-caret";
import { FunStage } from "./fun-stage";
import { isModalOpen } from "./picker-modal";
import { countCorrectWords } from "@/lib/typing-metrics";

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
}: {
  word: string;
  wordIndex: number;
  typedChars: { char: string; correct: boolean; extra?: boolean }[];
  currentWordIndex: number;
  /** show typed letters as plain text, hiding mistakes */
  blindMode: boolean;
  /** hidden mod: word is invisible but keeps its space */
  hidden: boolean;
}) {
  const isCurrentWord = wordIndex === currentWordIndex;
  const isWordComplete = wordIndex < currentWordIndex;
  const caretIndex = typedChars.length;
  // Finished words with missing letters get an error underline
  const hasMissingChars = !blindMode && isWordComplete && typedChars.length < word.length;

  const letters = word.split("").map((char, charIndex) => {
    const typedChar = typedChars[charIndex];
    const color = !typedChar ? "text-sub" : typedChar.correct || blindMode ? "text-text" : "text-error";
    return (
      <span key={charIndex} data-char className={color}>
        {char}
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

export function TypingArea() {
  const {
    words,
    typedChars,
    currentWordIndex,
    isTestActive,
    isTestComplete,
    handleKeyPress,
    smoothCaret,
    fontSize,
    caretStyle,
    visibleLines,
    blindMode,
    mods,
  } = useTypingStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const effectiveFontSize = Math.round(fontSize * 1.5);
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

  // Ensure reset returns viewport to the first line
  useEffect(() => {
    if (!wordsRef.current) return;

    const firstWordTypedCount = typedChars[0]?.length || 0;
    if (currentWordIndex === 0 && firstWordTypedCount === 0) {
      wordsRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [currentWordIndex, typedChars]);

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
    const container = wordsRef.current;
    const currentWordEl = container?.querySelectorAll<HTMLElement>("[data-word]")[currentWordIndex];
    if (!container || !currentWordEl) return;

    const lineHeight = effectiveFontSize * 1.6;
    const lineIndex = Math.round(currentWordEl.offsetTop / lineHeight);
    const linesAbove = visibleLines >= 3 ? 1 : 0;
    container.scrollTo({ top: Math.max(0, lineIndex - linesAbove) * lineHeight, behavior: "smooth" });
  }, [currentWordIndex, effectiveFontSize, visibleLines]);

  if (isTestComplete) {
    return null;
  }

  const mistakes = typedChars.reduce((sum, word) => sum + word.filter((c) => !c.correct || c.extra).length, 0);

  return (
    <FunStage correctWords={countCorrectWords(words, typedChars, currentWordIndex)} mistakes={mistakes} className="w-full">
      <div
        ref={containerRef}
        tabIndex={0}
        className="relative outline-none w-full"
        style={{ fontSize: `${effectiveFontSize}px` }}
      >
        {/* Words container */}
        <div
          ref={wordsRef}
          className="relative overflow-hidden leading-relaxed font-mono select-none px-4"
          style={{ 
            // exactly `visibleLines` lines, so neighboring lines never peek in
            height: `${visibleLines * effectiveFontSize * 1.6}px`,
            lineHeight: `${effectiveFontSize * 1.6}px`,
          }}
        >
          {isCaretReady && (
            <AnimatedCaret
              caretPosition={caretPosition}
              smoothCaret={smoothCaret}
              fontSize={effectiveFontSize}
              caretStyle={caretStyle}
            />
          )}

          {/* Words */}
          <div className="flex flex-wrap gap-x-3">
            {words.map((word, wordIndex) => (
              <Word
                key={wordIndex}
                word={word}
                wordIndex={wordIndex}
                typedChars={typedChars[wordIndex] || []}
                currentWordIndex={currentWordIndex}
                blindMode={blindMode}
                hidden={mods.includes("hidden") && wordIndex > currentWordIndex + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </FunStage>
  );
}
