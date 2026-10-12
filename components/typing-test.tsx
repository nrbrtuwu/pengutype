"use client";

import { useEffect, useCallback } from "react";
import { useTypingStore } from "@/lib/store";
import { TypingArea } from "./typing-area";
import { Timer } from "./timer";
import { Results } from "./results";
import { ModeSelector } from "./mode-selector";
import { SpellingClimb } from "./spelling-climb";
import { SpellLadderSelector } from "./spell-ladder-selector";
import { Toaster, toast } from "sonner";
import { themes } from "@/lib/themes";

export function TypingTest() {
  const {
    gameMode,
    mode,
    wordOption,
    language,
    restartKeybind,
    isTestActive,
    isTestComplete,
    showSettings,
    showStatsPanel,
    showCommandPalette,
    suppressResultRecording,
    theme,
    resetTest,
    exitRetryMode,
    invalidationNotice,
    clearInvalidationNotice,
  } = useTypingStore();
  const currentTheme = themes[theme];


  const resetFromKeybind = useCallback(() => {
    if (suppressResultRecording && !isTestActive) {
      exitRetryMode();
      return;
    }

    resetTest();
  }, [suppressResultRecording, isTestActive, exitRetryMode, resetTest]);

  // New words on mount and whenever test settings change
  useEffect(() => {
    if (gameMode === "normal") {
      resetTest();
    }
  }, [gameMode, mode, wordOption, language, resetTest]);

  // Keyboard shortcuts for restart
  useEffect(() => {
    if (gameMode !== "normal") {
      return;
    }

    let isTabDown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();

        if (restartKeybind === "tab") {
          if (!e.repeat) {
            resetFromKeybind();
          }
          return;
        }

        isTabDown = true;
      }

      const hasOverlayOpen = showSettings || showStatsPanel || showCommandPalette;

      if (e.key === "Escape" && isTestActive && !isTestComplete && !hasOverlayOpen) {
        e.preventDefault();
        if (suppressResultRecording) {
          exitRetryMode();
        } else {
          resetTest();
        }
        return;
      }

      if (restartKeybind === "tab-enter" && e.key === "Enter" && isTabDown) {
        e.preventDefault();
        resetFromKeybind();
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
  }, [
    resetFromKeybind,
    isTestActive,
    isTestComplete,
    suppressResultRecording,
    exitRetryMode,
    resetTest,
    restartKeybind,
    showSettings,
    showStatsPanel,
    showCommandPalette,
    gameMode,
  ]);

  useEffect(() => {
    if (!invalidationNotice) {
      return;
    }

    toast.error("test invalidated", {
      description: invalidationNotice.reason,
      duration: 4500,
      closeButton: false,
    });

    clearInvalidationNotice();
  }, [invalidationNotice, clearInvalidationNotice]);

  useEffect(() => {
    if (!isTestComplete) {
      toast.dismiss();
    }
  }, [isTestComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <Toaster
        position="bottom-right"
        offset={{ bottom: 88 }}
        richColors
        theme="dark"
        toastOptions={{
          className: "pengu-toast",
        }}
      />

      {gameMode === "normal" ? <ModeSelector /> : <SpellLadderSelector />}

      {/* Main content area */}
      <div className="w-full max-w-4xl mx-auto">
        {gameMode === "normal" && suppressResultRecording && !isTestComplete && (
          <div className="mb-4 text-center">
            <p
              className="text-sm sm:text-base font-bold tracking-wide italic"
              style={{
                color: currentTheme.foreground,
              }}
            >
              retry mode active
            </p>
            {!isTestActive && (
              <p
                className="text-xs sm:text-sm mt-1 italic"
                style={{
                  color: currentTheme.sub,
                }}
              >
                new bests on this retried test will not count toward history or records.
              </p>
            )}
          </div>
        )}

        {gameMode === "normal" ? (
          <>
            <Timer />
            <TypingArea />
            <Results />
          </>
        ) : (
          <SpellingClimb />
        )}
      </div>
    </div>
  );
}
