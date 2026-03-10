"use client";

import { useEffect, useRef, memo } from "react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { useCaretPosition } from "@/hooks/use-caret-position";
import { AnimatedCaret } from "./animated-caret";

// Memoized character component to prevent unnecessary re-renders
const Character = memo(function Character({ 
  char, 
  color,
  isMissed,
  missedUnderlineColor,
}: { 
  char: string; 
  color: string;
  isMissed?: boolean;
  missedUnderlineColor?: string;
}) {
  return (
    <span 
      data-char
      style={{
        color,
        textDecorationLine: isMissed ? "underline" : "none",
        textDecorationColor: isMissed ? (missedUnderlineColor ?? color) : undefined,
        textUnderlineOffset: isMissed ? "0.22em" : undefined,
        textDecorationThickness: isMissed ? "2px" : undefined,
      }}
      className="transition-colors duration-75"
    >
      {char}
    </span>
  );
});

const CaretAnchor = memo(function CaretAnchor() {
  return (
    <span
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
});

// Memoized word component
const Word = memo(function Word({
  word,
  wordIndex,
  typedChars,
  currentWordIndex,
  theme,
}: {
  word: string;
  wordIndex: number;
  typedChars: { char: string; correct: boolean; extra?: boolean }[];
  currentWordIndex: number;
  theme: string;
}) {
  const currentTheme = themes[theme];
  const isCurrentWord = wordIndex === currentWordIndex;
  const isWordComplete = wordIndex < currentWordIndex;
  const caretIndex = typedChars.length;
  const baseChars = word.split("");
  const hasMissingChars = isWordComplete && typedChars.length < baseChars.length;
  const extraChars = typedChars.filter((c) => c.extra);
  const coreContent = baseChars.map((char, charIndex) => {
    const typedChar = typedChars[charIndex];
    let color = currentTheme.sub;
    const shouldUnderlineWord = hasMissingChars;

    if (typedChar) {
      color = typedChar.correct ? currentTheme.correct : currentTheme.incorrect;
    } else if (isWordComplete) {
      color = currentTheme.missing;
    }

    return (
      <Character
        key={`char-${charIndex}`}
        char={char}
        color={color}
        isMissed={shouldUnderlineWord}
        missedUnderlineColor={currentTheme.incorrect}
      />
    );
  });

  if (isCurrentWord && caretIndex <= baseChars.length) {
    coreContent.splice(
      caretIndex,
      0,
      <CaretAnchor key="caret-anchor" />,
    );
  }

  return (
    <span
      data-word
      className="inline-block"
    >
      {coreContent}
      
      {/* Extra characters */}
      {extraChars.map((typedChar, extraIndex) => (
        <span
          key={`extra-${extraIndex}`}
          style={{ color: currentTheme.extra }}
        >
          {typedChar.char}
        </span>
      ))}

      {isCurrentWord && caretIndex > baseChars.length && (
        <CaretAnchor key="caret-anchor-after-extra" />
      )}
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
    suppressResultRecording,
    handleKeyPress,
    theme,
    smoothCaret,
    caretStyle,
    fontSize,
  } = useTypingStore();
  const currentTheme = themes[theme];

  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const effectiveFontSize = Math.round(fontSize * 1.5);
  const { caretPosition, isCaretReady } = useCaretPosition({
    wordsRef,
    caretStyle,
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
      if (isTestComplete) return;

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

  // Scroll words into view
  useEffect(() => {
    if (!wordsRef.current) return;
    
    const wordElements = wordsRef.current.querySelectorAll("[data-word]");
    const currentWordEl = wordElements[currentWordIndex] as HTMLElement;
    
    if (currentWordEl) {
      const containerRect = wordsRef.current.getBoundingClientRect();
      const wordRect = currentWordEl.getBoundingClientRect();
      
      if (wordRect.top > containerRect.top + containerRect.height * 0.6) {
        wordsRef.current.scrollTo({
          top: wordsRef.current.scrollTop + wordRect.height * 2,
          behavior: "smooth"
        });
      }
    }
  }, [currentWordIndex]);

  if (isTestComplete) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative outline-none w-full"
      style={{ fontSize: `${effectiveFontSize}px` }}
    >
      {/* Words container */}
      <div
        ref={wordsRef}
        className="relative overflow-hidden leading-relaxed font-mono select-none p-4"
        style={{ 
          height: `${effectiveFontSize * 5}px`,
          lineHeight: `${effectiveFontSize * 1.6}px`,
        }}
      >
        {isCaretReady && (
          <AnimatedCaret
            caretPosition={caretPosition}
            smoothCaret={smoothCaret}
            caretStyle={caretStyle}
            fontSize={effectiveFontSize}
            theme={theme}
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
              theme={theme}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
