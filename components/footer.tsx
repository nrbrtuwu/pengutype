"use client";

import { useTypingStore } from "@/lib/store";
import { Github } from "lucide-react";
import { Kbd } from "./result-parts";

export function Footer() {
  const restartKeybind = useTypingStore((state) => state.restartKeybind);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 px-6 py-5 text-xs text-sub bg-bg transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-5">
          <span>
            <Kbd>tab</Kbd>
            {restartKeybind === "tab-enter" && <> + <Kbd>enter</Kbd></>} - restart
          </span>
          <span className="hidden md:inline">
            <Kbd>ctrl</Kbd> + <Kbd>k</Kbd> - command line
          </span>
          <span className="hidden md:inline">
            <Kbd>ctrl</Kbd> + <Kbd>p</Kbd> - settings
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="italic">alpha build</span>
          <a
            href="https://github.com/nrbrtuwu/PenguType"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-text transition-colors"
          >
            <Github size={14} />
            github
          </a>
        </div>
      </div>
    </footer>
  );
}
