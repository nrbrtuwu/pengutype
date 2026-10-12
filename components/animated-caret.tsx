"use client";

import { motion } from "framer-motion";
import { themes, ThemeKey } from "@/lib/themes";

interface AnimatedCaretProps {
  caretPosition: { x: number; y: number };
  smoothCaret: boolean;
  fontSize: number;
  theme: ThemeKey;
}

export function AnimatedCaret({
  caretPosition,
  smoothCaret,
  fontSize,
  theme,
}: AnimatedCaretProps) {
  const currentTheme = themes[theme];
  const caretWidth = 2;
  const caretHeight = Math.max(10, Math.round(fontSize * 1.2));

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      initial={false}
      animate={{ x: caretPosition.x, y: caretPosition.y }}
      transition={
        smoothCaret
          ? { type: "spring", stiffness: 520, damping: 38, mass: 0.25 }
          : { duration: 0 }
      }
      style={{
        width: caretWidth,
        height: caretHeight,
        backgroundColor: currentTheme.caret,
        borderRadius: 1,
        boxShadow: `0 0 10px ${currentTheme.caret}`,
        left: 0,
        top: 0,
        willChange: "transform",
      }}
    >
      <span
        className="absolute inset-0 rounded-sm animate-pulse"
        style={{ backgroundColor: currentTheme.caret }}
      />
    </motion.div>
  );
}
