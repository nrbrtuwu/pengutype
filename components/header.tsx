"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { languages, getLanguageDisplayName, LanguageKey } from "@/lib/words";
import { motion } from "framer-motion";
import { Settings, BarChart3, Languages } from "lucide-react";
import Link from "next/link";

export function Header() {
  const {
    theme,
    toggleSettings,
    toggleStatsPanel,
    setLanguage,
    language,
  } = useTypingStore();

  const currentTheme = themes[theme];
  const currentLanguage = getLanguageDisplayName(language);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [languageQuery, setLanguageQuery] = useState("");
  const [highlightedLanguageIndex, setHighlightedLanguageIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filteredLanguages = useMemo(() => {
    const query = languageQuery.trim().toLowerCase();
    const entries = Object.keys(languages) as LanguageKey[];

    if (!query) {
      return entries;
    }

    return entries.filter((key) => {
      const displayName = getLanguageDisplayName(key).toLowerCase();
      return displayName.includes(query) || key.toLowerCase().includes(query);
    });
  }, [languageQuery]);

  useEffect(() => {
    if (!showLanguagePicker) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowLanguagePicker(false);
        return;
      }

      if (filteredLanguages.length === 0) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedLanguageIndex((prev) => (prev + 1) % filteredLanguages.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedLanguageIndex((prev) => (prev - 1 + filteredLanguages.length) % filteredLanguages.length);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredLanguages[highlightedLanguageIndex];
        if (!selected) return;

        setLanguage(selected);
        setShowLanguagePicker(false);
        setLanguageQuery("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLanguagePicker, filteredLanguages, highlightedLanguageIndex, setLanguage]);

  useEffect(() => {
    if (!showLanguagePicker) {
      setHighlightedLanguageIndex(0);
      return;
    }

    if (filteredLanguages.length === 0) {
      setHighlightedLanguageIndex(0);
      return;
    }

    setHighlightedLanguageIndex((prev) => Math.min(prev, filteredLanguages.length - 1));
  }, [showLanguagePicker, filteredLanguages]);

  useEffect(() => {
    if (!showLanguagePicker) return;

    const activeOption = optionRefs.current[highlightedLanguageIndex];
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [highlightedLanguageIndex, showLanguagePicker]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-30 px-6 py-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <motion.div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`,
              }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl relative z-10" role="img" aria-label="Penguin">
                🐧
              </span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
              />
            </motion.div>
            <div>
              <h1 
                className="text-2xl font-bold tracking-tight"
                style={{ color: currentTheme.foreground }}
              >
                PenguType
              </h1>
            </div>
          </Link>

          {/* Centered language selector */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.button
              onClick={() => setShowLanguagePicker(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass transition-all duration-300"
              style={{
                color: currentTheme.foreground,
                textShadow: `0 0 8px ${currentTheme.primary}55`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = currentTheme.primary;
                e.currentTarget.style.textShadow = `0 0 14px ${currentTheme.primary}aa`;
                e.currentTarget.style.boxShadow = `0 0 20px ${currentTheme.primary}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.foreground;
                e.currentTarget.style.textShadow = `0 0 8px ${currentTheme.primary}55`;
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Select language"
            >
              <Languages size={20} />
              <span className="text-sm font-medium tracking-wide">{currentLanguage}</span>
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Stats panel */}
            <motion.button
              onClick={toggleStatsPanel}
              className="p-3 rounded-xl glass transition-all duration-300"
              style={{ color: currentTheme.sub }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = currentTheme.primary;
                e.currentTarget.style.boxShadow = `0 0 20px ${currentTheme.primary}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.sub;
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Open statistics"
            >
              <BarChart3 size={20} />
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={toggleSettings}
              className="p-3 rounded-xl glass transition-all duration-300"
              style={{ color: currentTheme.sub }}
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = currentTheme.primary;
                e.currentTarget.style.boxShadow = `0 0 20px ${currentTheme.primary}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.sub;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Settings size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {showLanguagePicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: `${currentTheme.background}cc` }}
            onClick={() => setShowLanguagePicker(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed top-[18%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              backgroundColor: currentTheme.background,
              border: `1px solid ${currentTheme.secondary}`,
              boxShadow: `0 20px 60px ${currentTheme.background}cc`,
            }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: currentTheme.secondary }}
            >
              <input
                type="text"
                value={languageQuery}
                onChange={(e) => setLanguageQuery(e.target.value)}
                placeholder="Type a language..."
                autoFocus
                className="w-full bg-transparent outline-none"
                style={{ color: currentTheme.foreground }}
              />
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((key, index) => (
                  <button
                    key={key}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    className="w-full text-left px-4 py-2 transition-colors"
                    style={{ 
                      color: currentTheme.foreground,
                      backgroundColor: index === highlightedLanguageIndex ? currentTheme.secondary : "transparent"
                    }}
                    onMouseEnter={(e) => {
                      setHighlightedLanguageIndex(index);
                      e.currentTarget.style.backgroundColor = currentTheme.secondary;
                    }}
                    onMouseLeave={(e) => {
                      if (index !== highlightedLanguageIndex) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                    onClick={() => {
                      setLanguage(key);
                      setShowLanguagePicker(false);
                      setLanguageQuery("");
                    }}
                  >
                    {getLanguageDisplayName(key)}
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-sm" style={{ color: currentTheme.sub }}>
                  No languages found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
