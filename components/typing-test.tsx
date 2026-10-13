"use client";

import { useEffect, useCallback } from "react";
import { useTypingStore } from "@/lib/store";
import { TypingArea } from "./typing-area";
import { Timer } from "./timer";
import { Results } from "./results";
import { ModeSelector } from "./mode-selector";
import { SpellingClimb } from "./spelling-climb";
import { SpellLadderSelector } from "./spell-ladder-selector";
import { isModalOpen } from "./picker-modal";
import { Toaster, toast } from "sonner";

export function TypingTest() {
  const {
    gameMode,
    mode,
    wordOption,
    language,
    restartKeybind,
    isTestActive,
    isTestComplete,
    showCommandPalette,
    suppressResultRecording,
    resetTest,
    exitRetryMode,
    invalidationNotice,
    clearInvalidationNotice,
  } = useTypingStore();


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
      if (isModalOpen()) return;

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


      if (e.key === "Escape" && isTestActive && !isTestComplete && !showCommandPalette) {
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
    <div className="min-h-screen flex items-center justify-center px-24 relative z-10">
      <Toaster
        position="bottom-right"
        offset={{ bottom: 88 }}
        toastOptions={{ className: "pengu-toast" }}
      />

      {gameMode === "normal" ? <ModeSelector /> : <SpellLadderSelector />}

      {/* Main content area */}
      <div className="w-full max-w-4xl mx-auto">
        {gameMode === "normal" && suppressResultRecording && !isTestComplete && (
          <div className="mb-4 text-center">
            <p className="text-sm sm:text-base font-medium text-main">retry mode</p>
            {!isTestActive && (
              <p className="text-xs sm:text-sm mt-1 text-sub">
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
