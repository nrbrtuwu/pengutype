"use client";

import { RotateCcw } from "lucide-react";
import type { RestartKeybind } from "@/lib/store";

/** Vertical test-config rail pinned to the left edge, shown before a test starts. */
export function SideRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-1.5 rounded-lg bg-sub-alt">
      {children}
    </div>
  );
}

export function RailDivider() {
  return <div className="w-5 mx-auto my-1 h-0.5 rounded-full bg-bg" />;
}

export function RailOption({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-10 h-9 rounded font-mono text-sm transition-colors ${
        active ? "text-main" : "text-sub hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

export function RailLabel({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center h-7 text-sub/60">{children}</div>;
}

export function RailRestart({ onClick, restartKeybind }: { onClick: () => void; restartKeybind: RestartKeybind }) {
  return (
    <RailOption active={false} onClick={onClick} title={`restart (${restartKeybind === "tab" ? "tab" : "tab + enter"})`}>
      <RotateCcw size={16} />
    </RailOption>
  );
}
