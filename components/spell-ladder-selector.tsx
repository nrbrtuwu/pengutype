"use client";

import { useTypingStore, TIME_OPTIONS } from "@/lib/store";
import { themes } from "@/lib/themes";
import { RotateCcw, Infinity as InfinityIcon, Timer } from "lucide-react";
import { RailDivider, RailGroup, RailOption, RailRestart, SideRail } from "./side-rail";

export function SpellLadderSelector() {
  const {
    spellLadderStarted,
    timeOption,
    setTimeOption,
    spellingRepeatMode,
    setSpellingRepeatMode,
    requestSpellLadderReset,
    restartKeybind,
    theme,
  } = useTypingStore();

  const currentTheme = themes[theme];

  if (spellLadderStarted) {
    return null;
  }

  const groupLabel = (icon: React.ReactNode) => (
    <div className="flex items-center justify-center h-8 pointer-events-none" style={{ color: currentTheme.sub }}>
      {icon}
    </div>
  );

  return (
    <SideRail>
      <RailGroup theme={currentTheme}>
        {groupLabel(<Timer size={16} />)}
        {TIME_OPTIONS.map((t) => (
          <RailOption key={t} active={timeOption === t} onClick={() => setTimeOption(t)} title={`${t} seconds`} theme={currentTheme}>
            {t}
          </RailOption>
        ))}
      </RailGroup>

      <RailDivider theme={currentTheme} />

      <RailGroup theme={currentTheme}>
        {groupLabel(<RotateCcw size={16} />)}
        <RailOption
          active={spellingRepeatMode === "single"}
          onClick={() => setSpellingRepeatMode("single")}
          title="one repeat"
          theme={currentTheme}
        >
          1
        </RailOption>
        <RailOption
          active={spellingRepeatMode === "infinite"}
          onClick={() => setSpellingRepeatMode("infinite")}
          title="infinite repeats"
          theme={currentTheme}
        >
          <InfinityIcon size={16} />
        </RailOption>
      </RailGroup>

      <RailDivider theme={currentTheme} />

      <RailRestart onClick={requestSpellLadderReset} restartKeybind={restartKeybind} theme={currentTheme} />
    </SideRail>
  );
}
