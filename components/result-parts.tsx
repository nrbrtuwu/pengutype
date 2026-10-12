"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronRight, type LucideIcon } from "lucide-react";
import type { Theme } from "@/lib/themes";
import type { RestartKeybind } from "@/lib/store";

const CONFETTI_COUNT = 90;
const CONFETTI_DURATION_MS = 1800;

/** Full-screen confetti burst plus a "new best!" badge. `burstKey` changes per result so each new best re-fires. */
export function NewBestCelebration({ show, burstKey, theme }: { show: boolean; burstKey: unknown; theme: Theme }) {
  const [showConfetti, setShowConfetti] = useState(false);

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
        color: [theme.primary, theme.caret, theme.foreground][id % 3],
      })),
    [burstKey]
  );

  useEffect(() => {
    setShowConfetti(show);
    if (!show) return;

    const timer = window.setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [show, burstKey]);

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

      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-4 text-center"
        >
          <span
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}33, ${theme.caret}33)`,
              color: theme.foreground,
              boxShadow: `0 0 24px ${theme.primary}33`,
            }}
          >
            🎉 new best!
          </span>
        </motion.div>
      )}
    </>
  );
}

export function RestartHint({ restartKeybind, theme }: { restartKeybind: RestartKeybind; theme: Theme }) {
  const kbd = (label: string) => (
    <kbd
      className="px-2 py-1 rounded-lg text-xs font-mono font-bold"
      style={{ backgroundColor: theme.secondary, color: theme.foreground }}
    >
      {label}
    </kbd>
  );

  return (
    <div className="text-center mt-8">
      <span className="text-sm font-medium" style={{ color: theme.sub }}>
        press {kbd("tab")}
        {restartKeybind === "tab-enter" && <> + {kbd("enter")}</>}
        {" to restart"}
      </span>
    </div>
  );
}

export function ResultActions({ onRetry, onNext, theme }: { onRetry: () => void; onNext: () => void; theme: Theme }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02]"
        style={{ backgroundColor: `${theme.background}dd`, color: theme.foreground }}
      >
        <RotateCcw size={18} />
        <span>try again</span>
      </button>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.caret})`,
          color: theme.background,
          boxShadow: `0 0 20px ${theme.primary}44`
        }}
      >
        <span>next test</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function StatTile({
  icon: Icon,
  value,
  label,
  color,
  labelColor,
  theme,
}: {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  color: string;
  labelColor?: string;
  theme: Theme;
}) {
  return (
    <div
      className="text-center p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
      style={{ backgroundColor: `${theme.background}dd` }}
    >
      <Icon className="mx-auto mb-2" size={24} style={{ color }} />
      <div className="text-5xl md:text-6xl font-mono font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-sm tracking-wider mt-2 font-medium" style={{ color: labelColor ?? theme.sub }}>
        {label}
      </div>
    </div>
  );
}

export function DetailItem({ label, theme, children }: { label: string; theme: Theme; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs tracking-wider mb-2 font-medium" style={{ color: theme.sub }}>
        {label}
      </div>
      <div className="text-lg font-mono font-medium" style={{ color: theme.foreground }}>
        {children}
      </div>
    </div>
  );
}

/** Colored "a / b / c" counts with a hover tooltip naming each one. */
export function CharBreakdown({ parts, theme }: { parts: { label: string; value: number; color: string }[]; theme: Theme }) {
  return (
    <div className="relative inline-flex group">
      <div className="text-lg font-mono flex items-center gap-1 font-medium cursor-help">
        {parts.map((part, index) => (
          <span key={part.label} className="contents">
            {index > 0 && <span style={{ color: theme.sub }}>/</span>}
            <span style={{ color: part.color }}>{part.value}</span>
          </span>
        ))}
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20"
        style={{
          color: theme.foreground,
          backgroundColor: `${theme.background}f2`,
          boxShadow: `0 8px 24px ${theme.background}cc`
        }}
      >
        {parts.map((part) => (
          <div key={part.label}>{part.label}: {part.value}</div>
        ))}
      </div>
    </div>
  );
}
