"use client";

import { useState, useEffect, useMemo } from "react";
import { useTypingStore } from "@/lib/store";
import { themes, ThemeKey } from "@/lib/themes";
import { languages, LanguageKey, getLanguageDisplayName } from "@/lib/words";
import { motion, AnimatePresence } from "framer-motion";
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
    theme,
    setTheme,
    setLanguage,
    setMode,
    setTimeOption,
    setWordOption,
    resetTest,
    toggleSettings,
    toggleStatsPanel,
    restartKeybind
  } = useTypingStore();

  const currentTheme = themes[theme];
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
        label: t.name,
        category: "theme",
        action: () => {
          setTheme(key as ThemeKey);
          toggleCommandPalette();
        }
      });
    });

    // Language commands
    Object.entries(languages).forEach(([key, lang]) => {
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
    [15, 30, 60, 120].forEach((t) => {
      cmds.push({
        id: `time-${t}`,
        icon: <Clock size={16} />,
        label: `${t} seconds`,
        category: "time",
        action: () => {
          setMode("time");
          setTimeOption(t as 15 | 30 | 60 | 120);
          toggleCommandPalette();
        }
      });
    });

    // Word options
    [10, 25, 50, 100].forEach((w) => {
      cmds.push({
        id: `words-${w}`,
        icon: <Hash size={16} />,
        label: `${w} words`,
        category: "words",
        action: () => {
          setMode("words");
          setWordOption(w as 10 | 25 | 50 | 100);
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
        toggleSettings();
        toggleCommandPalette();
      },
      shortcut: "esc"
    });
    cmds.push({
      id: "stats",
      icon: <BarChart3 size={16} />,
      label: "open statistics",
      category: "action",
      action: () => {
        toggleStatsPanel();
        toggleCommandPalette();
      }
    });

    return cmds;
  }, [setTheme, setLanguage, setMode, setTimeOption, setWordOption, resetTest, toggleSettings, toggleCommandPalette, toggleStatsPanel, restartKeybind]);

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
      if (e.key === "Escape" && !showCommandPalette) {
        toggleSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, showCommandPalette, toggleSettings]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <AnimatePresence>
      {showCommandPalette && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: `${currentTheme.background}cc` }}
            onClick={toggleCommandPalette}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: currentTheme.background, borderWidth: 1, borderColor: currentTheme.secondary }}
          >
            {/* Search input */}
            <div 
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: currentTheme.secondary }}
            >
              <Search size={18} style={{ color: currentTheme.sub }} />
              <input
                type="text"
                placeholder="search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base"
                style={{ color: currentTheme.foreground }}
                autoFocus
              />
              <kbd 
                className="px-2 py-1 rounded text-xs font-mono"
                style={{ backgroundColor: currentTheme.secondary, color: currentTheme.sub }}
              >
                esc
              </kbd>
            </div>

            {/* Commands list */}
            <div className="max-h-80 overflow-y-auto py-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <div 
                    className="px-4 py-2 text-xs tracking-wider"
                    style={{ color: currentTheme.sub }}
                  >
                    {category}
                  </div>
                  {cmds.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={cmd.action}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                        style={{
                          backgroundColor: isSelected ? currentTheme.secondary : "transparent",
                          color: isSelected ? currentTheme.primary : currentTheme.foreground
                        }}
                        whileHover={{ backgroundColor: currentTheme.secondary }}
                      >
                        <span style={{ color: isSelected ? currentTheme.primary : currentTheme.sub }}>
                          {cmd.icon}
                        </span>
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd 
                            className="px-2 py-1 rounded text-xs font-mono"
                            style={{ backgroundColor: currentTheme.background, color: currentTheme.sub }}
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div 
                  className="px-4 py-8 text-center"
                  style={{ color: currentTheme.sub }}
                >
                  No commands found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
