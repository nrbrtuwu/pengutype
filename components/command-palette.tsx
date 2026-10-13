"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTypingStore, TIME_OPTIONS, WORD_OPTIONS } from "@/lib/store";
import { themes, ThemeKey } from "@/lib/themes";
import { Modal } from "./picker-modal";
import { languages, LanguageKey, getLanguageDisplayName } from "@/lib/words";
import { Search, Palette, Globe, Clock, Hash, RotateCcw, Settings, BarChart3 } from "lucide-react";

interface Command {
  id: string;
  icon: React.ReactNode;
  label: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const {
    showCommandPalette,
    toggleCommandPalette,
    setTheme,
    setLanguage,
    setMode,
    setTimeOption,
    setWordOption,
    resetTest,
    restartKeybind
  } = useTypingStore();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build commands list
  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [];

    // Theme commands
    Object.entries(themes).forEach(([key, t]) => {
      cmds.push({
        id: `theme-${key}`,
        icon: <Palette size={16} />,
        label: t.name.toLowerCase(),
        category: "theme",
        action: () => {
          setTheme(key as ThemeKey);
          toggleCommandPalette();
        }
      });
    });

    // Language commands
    Object.keys(languages).forEach((key) => {
      cmds.push({
        id: `lang-${key}`,
        icon: <Globe size={16} />,
        label: getLanguageDisplayName(key),
        category: "language",
        action: () => {
          setLanguage(key as LanguageKey);
          toggleCommandPalette();
        }
      });
    });

    // Mode commands
    cmds.push({
      id: "mode-time",
      icon: <Clock size={16} />,
      label: "time mode",
      category: "mode",
      action: () => {
        setMode("time");
        toggleCommandPalette();
      }
    });
    cmds.push({
      id: "mode-words",
      icon: <Hash size={16} />,
      label: "words mode",
      category: "mode",
      action: () => {
        setMode("words");
        toggleCommandPalette();
      }
    });

    // Time options
    TIME_OPTIONS.forEach((t) => {
      cmds.push({
        id: `time-${t}`,
        icon: <Clock size={16} />,
        label: `${t} seconds`,
        category: "time",
        action: () => {
          setMode("time");
          setTimeOption(t);
          toggleCommandPalette();
        }
      });
    });

    // Word options
    WORD_OPTIONS.forEach((w) => {
      cmds.push({
        id: `words-${w}`,
        icon: <Hash size={16} />,
        label: `${w} words`,
        category: "words",
        action: () => {
          setMode("words");
          setWordOption(w);
          toggleCommandPalette();
        }
      });
    });

    // Actions
    cmds.push({
      id: "restart",
      icon: <RotateCcw size={16} />,
      label: "restart test",
      category: "action",
      action: () => {
        resetTest();
        router.push("/");
        toggleCommandPalette();
      },
      shortcut: restartKeybind === "tab" ? "tab" : "tab + enter"
    });
    cmds.push({
      id: "settings",
      icon: <Settings size={16} />,
      label: "open settings",
      category: "action",
      action: () => {
        router.push("/settings");
        toggleCommandPalette();
      },
      shortcut: "ctrl + p"
    });
    cmds.push({
      id: "stats",
      icon: <BarChart3 size={16} />,
      label: "open statistics",
      category: "action",
      action: () => {
        router.push("/stats");
        toggleCommandPalette();
      }
    });

    return cmds;
  }, [setTheme, setLanguage, setMode, setTimeOption, setWordOption, resetTest, toggleCommandPalette, router, restartKeybind]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const lower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
    );
  }, [commands, search]);

  // Keyboard navigation
  useEffect(() => {
    if (!showCommandPalette) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          filteredCommands[selectedIndex]?.action();
          break;
        case "Escape":
          e.preventDefault();
          toggleCommandPalette();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCommandPalette, filteredCommands, selectedIndex, toggleCommandPalette]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset search when closing
  useEffect(() => {
    if (!showCommandPalette) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [showCommandPalette]);

  // Global shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  if (!showCommandPalette) return null;

  return (
    <Modal onClose={toggleCommandPalette} className="top-[20%] max-w-lg">
      <div className="flex items-center gap-3 px-4 py-3 text-sub">
        <Search size={18} />
        <input
          type="text"
          placeholder="search commands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-text placeholder:text-sub"
          autoFocus
        />
      </div>

      <div className="max-h-80 overflow-y-auto pb-2">
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <div key={category}>
            <div className="px-4 pt-2 pb-1 text-xs text-sub">{category}</div>
            {cmds.map((cmd) => {
              const index = filteredCommands.indexOf(cmd);
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left ${isSelected ? "bg-sub-alt text-text" : "text-sub"}`}
                >
                  {cmd.icon}
                  <span className="flex-1">{cmd.label}</span>
                  {cmd.shortcut && <span className="text-xs font-mono text-sub">{cmd.shortcut}</span>}
                </button>
              );
            })}
          </div>
        ))}

        {filteredCommands.length === 0 && <div className="px-4 py-8 text-center text-sub">no commands found</div>}
      </div>
    </Modal>
  );
}
