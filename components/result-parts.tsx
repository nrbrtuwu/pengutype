"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotionConfig } from "framer-motion";
import { RotateCcw, ChevronRight } from "lucide-react";
import { useTypingStore, type RestartKeybind } from "@/lib/store";
import { formatMods, type ModKey } from "@/lib/mods";

const CONFETTI_COUNT = 90;
const CONFETTI_DURATION_MS = 1800;
const CONFETTI_COLORS = ["var(--main)", "var(--text)", "var(--sub)"];

/** Confetti burst plus a "new best!" label. `burstKey` changes per result so each new best re-fires. */
export function NewBestCelebration({ show, burstKey }: { show: boolean; burstKey: unknown }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const reduceMotion = useReducedMotionConfig();
  const confettiEnabled = useTypingStore((state) => state.showConfetti) && !reduceMotion;

  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
        id,
        x: Math.random() * 100,
        drift: (Math.random() - 0.5) * 320,
        rotate: (Math.random() - 0.5) * 720,
        size: 5 + Math.random() * 8,
        delay: Math.random() * 0.45,
        duration: 1.2 + Math.random() * 1.2,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
      })),
    [burstKey]
  );

  useEffect(() => {
    setShowConfetti(show && confettiEnabled);
    if (!show || !confettiEnabled) return;

    const timer = window.setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [show, burstKey, confettiEnabled]);

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden">
              {pieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className="absolute rounded-[2px]"
                  style={{
                    left: `${piece.x}%`,
                    top: "-10vh",
                    width: piece.size,
                    height: piece.size * 0.65,
                    backgroundColor: piece.color,
                  }}
                  initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
                  animate={{ y: "120vh", x: piece.drift, rotate: piece.rotate, opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: piece.duration, delay: piece.delay, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {show && <div className="mb-6 text-center text-sm font-medium text-main">new best!</div>}
    </>
  );
}

/** Active fun modes on a results screen, with an unranked note. */
export function ModBadges({ mods }: { mods: ModKey[] | undefined }) {
  if (!mods || mods.length === 0) return null;
  return (
    <div className="mb-6 text-center text-sm">
      <span className="px-2 py-1 rounded bg-main text-bg font-mono font-bold">{formatMods(mods)}</span>
      <span className="ml-2 text-sub">fun mode · unranked</span>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="px-1.5 py-0.5 rounded bg-sub text-bg text-xs font-mono">{children}</kbd>;
}

export function RestartHint({ restartKeybind }: { restartKeybind: RestartKeybind }) {
  return (
    <p className="text-center mt-8 text-sm text-sub">
      <Kbd>tab</Kbd>
      {restartKeybind === "tab-enter" && <> + <Kbd>enter</Kbd></>} - restart test
    </p>
  );
}

const actionButtonClass =
  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sub hover:text-text hover:bg-sub-alt transition-colors";

export function ResultActions({ onRetry, onNext }: { onRetry: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={onRetry} className={actionButtonClass} title="repeat this test">
        <RotateCcw size={18} />
        <span>try again</span>
      </button>
      <button onClick={onNext} className={actionButtonClass} title="next test">
        <span>next test</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

/** Big headline number, e.g. wpm / accuracy. */
export function StatTile({ value, label, accent = true }: { value: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-sm text-sub">{label}</div>
      <div className={`text-5xl md:text-6xl font-mono leading-tight ${accent ? "text-main" : "text-text"}`}>{value}</div>
    </div>
  );
}

export function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-sub mb-1">{label}</div>
      <div className="text-lg font-mono text-text">{children}</div>
    </div>
  );
}

/** "a/b/c" counts with a hover tooltip naming each one. */
export function CharBreakdown({ parts }: { parts: { label: string; value: number }[] }) {
  return (
    <div className="relative inline-flex group cursor-help">
      {parts.map((part) => part.value).join("/")}

      <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs whitespace-nowrap bg-sub-alt text-text opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {parts.map((part) => (
          <div key={part.label}>
            {part.label}: {part.value}
          </div>
        ))}
      </div>
    </div>
  );
}
