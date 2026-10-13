"use client";

import { useEffect, useRef } from "react";
import { useTypingStore } from "@/lib/store";
import { Flashlight } from "./flashlight";
import { Sleepy } from "./sleepy";

const QUAKE_KEYFRAMES: Keyframe[] = [
  { translate: "0 0" },
  { translate: "-10px 4px" },
  { translate: "9px -5px" },
  { translate: "-7px -3px" },
  { translate: "6px 5px" },
  { translate: "-3px 2px" },
  { translate: "0 0" },
];

/**
 * Wraps the words (and caret) of a test and applies the active fun modes.
 * `correctWords` drives the flashlight radius, an increase in `mistakes` triggers the earthquake.
 */
export function FunStage({
  correctWords,
  mistakes,
  className = "",
  children,
}: {
  correctWords: number;
  mistakes: number;
  className?: string;
  children: React.ReactNode;
}) {
  const mods = useTypingStore((state) => state.mods);
  const stageRef = useRef<HTMLDivElement>(null);
  const previousMistakesRef = useRef(mistakes);

  useEffect(() => {
    if (mods.includes("earthquake") && mistakes > previousMistakesRef.current) {
      stageRef.current?.animate(QUAKE_KEYFRAMES, { duration: 350, easing: "ease-out" });
    }
    previousMistakesRef.current = mistakes;
  }, [mistakes, mods]);

  return (
    <div
      ref={stageRef}
      className={`${className} ${mods.includes("mirror") ? "[scale:-1_1]" : ""} ${mods.includes("drunk") ? "fun-drunk" : ""}`}
    >
      {children}
      {mods.includes("flashlight") && <Flashlight correctWords={correctWords} />}
      {mods.includes("sleepy") && <Sleepy blurTarget={stageRef} />}
    </div>
  );
}
