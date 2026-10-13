"use client";

import { useTypingStore, TIME_OPTIONS } from "@/lib/store";
import { Repeat, Infinity as InfinityIcon, Timer } from "lucide-react";
import { RailDivider, RailLabel, RailOption, RailRestart, SideRail } from "./side-rail";

export function SpellLadderSelector() {
  const {
    spellLadderStarted,
    timeOption,
    setTimeOption,
    spellingRepeatMode,
    setSpellingRepeatMode,
    requestSpellLadderReset,
    restartKeybind,
  } = useTypingStore();

  if (spellLadderStarted) {
    return null;
  }

  return (
    <SideRail>
      <RailLabel>
        <Timer size={14} />
      </RailLabel>
      {TIME_OPTIONS.map((t) => (
        <RailOption key={t} active={timeOption === t} onClick={() => setTimeOption(t)} title={`${t} seconds`}>
          {t}
        </RailOption>
      ))}

      <RailDivider />

      <RailLabel>
        <Repeat size={14} />
      </RailLabel>
      <RailOption active={spellingRepeatMode === "single"} onClick={() => setSpellingRepeatMode("single")} title="one ladder">
        1
      </RailOption>
      <RailOption active={spellingRepeatMode === "infinite"} onClick={() => setSpellingRepeatMode("infinite")} title="endless ladders">
        <InfinityIcon size={16} />
      </RailOption>

      <RailDivider />

      <RailRestart onClick={requestSpellLadderReset} restartKeybind={restartKeybind} />
    </SideRail>
  );
}
