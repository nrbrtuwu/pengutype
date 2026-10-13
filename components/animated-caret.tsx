"use client";

import { motion } from "framer-motion";
import type { CaretStyle } from "@/lib/store";

interface AnimatedCaretProps {
  caretPosition: { x: number; y: number };
  smoothCaret: boolean;
  fontSize: number;
  caretStyle: CaretStyle;
}

// monospace letters are ~0.6em wide
const LETTER_WIDTH_EM = 0.6;

export function AnimatedCaret({ caretPosition, smoothCaret, fontSize, caretStyle }: AnimatedCaretProps) {
  const height = Math.max(10, Math.round(fontSize * 1.2));
  const letterWidth = Math.round(fontSize * LETTER_WIDTH_EM);

  const shape = {
    line: { width: 2, height, top: 0, opacity: 1 },
    block: { width: letterWidth, height, top: 0, opacity: 0.4 },
    underline: { width: letterWidth, height: 3, top: height - 3, opacity: 1 },
  }[caretStyle];

  return (
    <motion.div
      data-caret
      className="absolute left-0 z-20 rounded-sm bg-caret pointer-events-none"
      initial={false}
      animate={{ x: caretPosition.x, y: caretPosition.y }}
      transition={smoothCaret ? { type: "spring", stiffness: 520, damping: 38, mass: 0.25 } : { duration: 0 }}
      style={shape}
    />
  );
}
