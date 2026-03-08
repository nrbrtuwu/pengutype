"use client";

import { useTypingStore, TestMode, TimeOption, WordOption } from "@/lib/store";
import { themes } from "@/lib/themes";
import { Timer, Type, RotateCcw } from "lucide-react";

const modeIcons = {
  time: Timer,
  words: Type
};

export function ModeSelector() {
  const {
    mode,
    setMode,
    timeOption,
    setTimeOption,
    wordOption,
    setWordOption,
    isTestActive,
    isTestComplete,
    theme,
    restartKeybind,
    resetTest
  } = useTypingStore();

  const currentTheme = themes[theme];

  const timeOptions: TimeOption[] = [15, 30, 60, 120];
  const wordOptions: WordOption[] = [10, 25, 50, 100];
  const restartShortcutLabel = restartKeybind === "tab" ? "Tab" : "Tab + Enter";

  // Hide during active test or when complete
  if (isTestActive || isTestComplete) {
    return null;
  }

  const handleModeChange = (newMode: TestMode) => {
    setMode(newMode);
    resetTest();
  };

  return (
    <div 
      className="fixed left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3"
    >
      {/* Mode selection */}
      <div 
        className="flex flex-col gap-1 p-2 rounded-xl"
        style={{ 
          backgroundColor: `${currentTheme.background}ee`,
          border: `1px solid ${currentTheme.sub}22`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {(["time", "words"] as TestMode[]).map((m) => {
          const Icon = modeIcons[m];
          const isActive = mode === m;
          
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isActive ? `${currentTheme.primary}22` : 'transparent',
                border: isActive ? `1px solid ${currentTheme.primary}44` : '1px solid transparent',
              }}
              title={m}
            >
              <Icon 
                size={18} 
                style={{ color: isActive ? currentTheme.primary : currentTheme.sub }} 
              />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div 
        className="w-6 mx-auto h-px"
        style={{ backgroundColor: `${currentTheme.sub}33` }}
      />

      {/* Time/Word options */}
      <div 
        className="flex flex-col gap-1 p-2 rounded-xl"
        style={{ 
          backgroundColor: `${currentTheme.background}ee`,
          border: `1px solid ${currentTheme.sub}22`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {mode === "time"
          ? timeOptions.map((t) => {
              const isActive = timeOption === t;
              return (
                <button
                  key={t}
                  onClick={() => setTimeOption(t)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: isActive ? currentTheme.primary : 'transparent',
                    color: isActive ? currentTheme.background : currentTheme.sub,
                    boxShadow: isActive ? `0 0 15px ${currentTheme.primary}44` : 'none',
                  }}
                >
                  {t}
                </button>
              );
            })
          : wordOptions.map((w) => {
              const isActive = wordOption === w;
              return (
                <button
                  key={w}
                  onClick={() => setWordOption(w)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: isActive ? currentTheme.primary : 'transparent',
                    color: isActive ? currentTheme.background : currentTheme.sub,
                    boxShadow: isActive ? `0 0 15px ${currentTheme.primary}44` : 'none',
                  }}
                >
                  {w}
                </button>
              );
            })}
      </div>

      {/* Divider */}
      <div 
        className="w-6 mx-auto h-px"
        style={{ backgroundColor: `${currentTheme.sub}33` }}
      />

      {/* Restart button */}
      <div 
        className="flex flex-col p-2 rounded-xl"
        style={{ 
          backgroundColor: `${currentTheme.background}ee`,
          border: `1px solid ${currentTheme.sub}22`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={() => resetTest()}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 hover:rotate-[-30deg]"
          style={{
            color: currentTheme.sub,
          }}
          title={`Restart (${restartShortcutLabel})`}
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
