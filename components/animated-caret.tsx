"use client";

import { motion } from "framer-motion";
import { themes, ThemeKey } from "@/lib/themes";
import { CaretStyle } from "@/hooks/use-caret-position";

interface AnimatedCaretProps {
  caretPosition: { x: number; y: number };
  smoothCaret: boolean;
  caretStyle: CaretStyle;
  fontSize: number;
  theme: ThemeKey;
}

export function AnimatedCaret({
  caretPosition,
  smoothCaret,
  caretStyle,
  fontSize,
  theme,
}: AnimatedCaretProps) {
  const currentTheme = themes[theme];
  const caretWidth = caretStyle === "line" ? 2 : Math.max(2, Math.round(fontSize * 0.58));
  const caretHeight = caretStyle === "underline" ? 3 : Math.max(10, Math.round(fontSize * 1.2));

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
        borderRadius: caretStyle === "line" ? 1 : 2,
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
