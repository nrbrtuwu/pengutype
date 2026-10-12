"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { Theme } from "@/lib/themes";
import type { RestartKeybind } from "@/lib/store";

/** Vertical option rail pinned to the left edge, shown before a test starts. */
export function SideRail({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3"
    >
      {children}
    </motion.div>
  );
}

export function RailGroup({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-1 p-2 rounded-xl"
      style={{
        backgroundColor: `${theme.background}ee`,
        border: `1px solid ${theme.sub}22`,
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

export function RailDivider({ theme }: { theme: Theme }) {
  return <div className="w-6 mx-auto h-px" style={{ backgroundColor: `${theme.sub}33` }} />;
}

export function RailOption({
  active,
  onClick,
  title,
  theme,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-medium transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: active ? theme.primary : "transparent",
        color: active ? theme.background : theme.sub,
        boxShadow: active ? `0 0 15px ${theme.primary}44` : "none",
      }}
    >
      {children}
    </button>
  );
}

export function RailRestart({ onClick, restartKeybind, theme }: { onClick: () => void; restartKeybind: RestartKeybind; theme: Theme }) {
  return (
    <RailGroup theme={theme}>
      <button
        onClick={onClick}
        className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 hover:rotate-[-30deg]"
        style={{ color: theme.sub }}
        title={`restart (${restartKeybind === "tab" ? "tab" : "tab + enter"})`}
      >
        <RotateCcw size={18} />
      </button>
    </RailGroup>
  );
}
