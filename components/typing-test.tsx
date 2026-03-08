"use client";

import { useEffect, useCallback } from "react";
import { useTypingStore } from "@/lib/store";
import { TypingArea } from "./typing-area";
import { Timer } from "./timer";
import { Results } from "./results";
import { ModeSelector } from "./mode-selector";

export function TypingTest() {
  const {
    mode,
    wordOption,
    language,
    restartKeybind,
    resetTest,
  } = useTypingStore();

  // Generate words on mount and when settings change
  const generateWords = useCallback(() => {
    resetTest();
  }, [mode, wordOption, language, resetTest]);

  useEffect(() => {
    generateWords();
  }, [generateWords]);

  // Keyboard shortcuts for restart
  useEffect(() => {
    let isTabDown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();

        if (restartKeybind === "tab") {
          if (!e.repeat) {
            generateWords();
          }
          return;
        }

        isTabDown = true;
      }

      if (restartKeybind === "tab-enter" && e.key === "Enter" && isTabDown) {
        e.preventDefault();
        generateWords();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
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
  }, [generateWords, restartKeybind]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      {/* Vertical sidebar for mode selection */}
      <ModeSelector />

      {/* Main content area */}
      <div className="w-full max-w-4xl mx-auto">
        {/* Timer / Stats display during test */}
        <Timer />

        {/* Typing area */}
        <TypingArea />

        {/* Results after test */}
        <Results />
      </div>
    </div>
  );
}
