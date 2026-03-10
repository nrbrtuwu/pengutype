"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { languages, getLanguageDisplayName, LanguageKey } from "@/lib/words";
import { motion } from "framer-motion";
import { Settings, BarChart3, Languages, CircleUser, Type } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const {
    gameMode,
    setGameMode,
    theme,
    toggleSettings,
    toggleStatsPanel,
    setLanguage,
    language,
    resetTest,
    cloudLastSyncedAt,
  } = useTypingStore();
  const { data: session, status } = useSession();

  const currentTheme = themes[theme];
  const currentLanguage = getLanguageDisplayName(language).toLowerCase();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [languageQuery, setLanguageQuery] = useState("");
  const [highlightedLanguageIndex, setHighlightedLanguageIndex] = useState(0);
  const [showGameModePicker, setShowGameModePicker] = useState(false);
  const [gameModeQuery, setGameModeQuery] = useState("");
  const [highlightedGameModeIndex, setHighlightedGameModeIndex] = useState(0);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [databaseJoinedAt, setDatabaseJoinedAt] = useState<string | null>(null);
  const languageOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const gameModeOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);

  const gameModes = useMemo(
    () => [
      { key: "normal", label: "normal" },
      { key: "spell-ladder", label: "spell ladder" },
    ],
    []
  );

  const currentGameModeLabel = gameModes.find((modeOption) => modeOption.key === gameMode)?.label ?? "normal";

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

  const filteredGameModes = useMemo(() => {
    const query = gameModeQuery.trim().toLowerCase();

    if (!query) {
      return gameModes;
    }

    return gameModes.filter((modeOption) => modeOption.label.toLowerCase().includes(query));
  }, [gameModes, gameModeQuery]);

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
    if (!showGameModePicker) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowGameModePicker(false);
        return;
      }

      if (filteredGameModes.length === 0) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedGameModeIndex((prev) => (prev + 1) % filteredGameModes.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedGameModeIndex((prev) => (prev - 1 + filteredGameModes.length) % filteredGameModes.length);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredGameModes[highlightedGameModeIndex];
        if (!selected) return;

        setGameMode(selected.key as "normal" | "spell-ladder");
        if (selected.key === "normal") {
          resetTest();
        }
        setShowGameModePicker(false);
        setGameModeQuery("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showGameModePicker, filteredGameModes, highlightedGameModeIndex, setGameMode, resetTest]);

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
    if (!showGameModePicker) {
      setHighlightedGameModeIndex(0);
      return;
    }

    if (filteredGameModes.length === 0) {
      setHighlightedGameModeIndex(0);
      return;
    }

    setHighlightedGameModeIndex((prev) => Math.min(prev, filteredGameModes.length - 1));
  }, [showGameModePicker, filteredGameModes]);

  useEffect(() => {
    if (!showLanguagePicker) return;

    const activeOption = languageOptionRefs.current[highlightedLanguageIndex];
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [highlightedLanguageIndex, showLanguagePicker]);

  useEffect(() => {
    if (!showGameModePicker) return;

    const activeOption = gameModeOptionRefs.current[highlightedGameModeIndex];
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [highlightedGameModeIndex, showGameModePicker]);

  useEffect(() => {
    if (!showAccountPanel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAccountPanel(false);
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!accountPanelRef.current) return;
      const target = event.target as Node;
      if (!accountPanelRef.current.contains(target)) {
        setShowAccountPanel(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [showAccountPanel]);

  const accountDisplayName =
    session?.user?.username ??
    session?.user?.globalName ??
    session?.user?.name ??
    session?.user?.email ??
    session?.user?.id ??
    "unknown user";

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setDatabaseJoinedAt(null);
      return;
    }

    let cancelled = false;

    const loadDatabaseJoinedAt = async () => {
      try {
        const response = await fetch(`/api/results?userId=${encodeURIComponent(userId)}&limit=1&offset=0&includeMeta=1`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { joinedAt?: string | null };
        if (!cancelled) {
          setDatabaseJoinedAt(data.joinedAt ?? null);
        }
      } catch {
      }
    };

    void loadDatabaseJoinedAt();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const accountCreatedLabel = databaseJoinedAt
    ? new Date(databaseJoinedAt).toLocaleDateString()
    : "unknown";

  const lastSyncLabel = cloudLastSyncedAt
    ? new Date(cloudLastSyncedAt).toLocaleString()
    : "never";

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
          <Link
            href="/"
            className="flex items-center gap-4 group"
            onClick={(event) => {
              event.preventDefault();
              resetTest();
            }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`,
              }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl relative z-10" role="img" aria-label="penguin">
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
                pengutype
              </h1>
            </div>
          </Link>

          {/* Centered game mode + language selector */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.button
              onClick={() => setShowGameModePicker(true)}
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.foreground;
                e.currentTarget.style.textShadow = `0 0 8px ${currentTheme.primary}55`;
              }}
              title="select game mode"
            >
              <Type size={20} />
              <span className="text-sm font-medium tracking-wide">{currentGameModeLabel}</span>
            </motion.button>

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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.foreground;
                e.currentTarget.style.textShadow = `0 0 8px ${currentTheme.primary}55`;
              }}
              title="select language"
            >
              <Languages size={20} />
              <span className="text-sm font-medium tracking-wide">{currentLanguage}</span>
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 relative" ref={accountPanelRef}>
            {/* Account */}
            <motion.button
              onClick={() => setShowAccountPanel((prev) => !prev)}
              className="p-3 rounded-xl glass transition-all duration-300"
              style={{ color: currentTheme.sub }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = currentTheme.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.sub;
              }}
              title="account"
            >
              <CircleUser size={20} />
            </motion.button>

            {showAccountPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className="absolute right-0 top-[calc(100%+0.5rem)] w-60 rounded-2xl p-4 z-50 glass-strong"
                style={{
                  border: `1px solid ${currentTheme.primary}66`,
                  boxShadow: `0 0 26px ${currentTheme.primary}33`,
                }}
              >
                <h3 className="text-sm font-semibold mb-1" style={{ color: currentTheme.foreground }}>
                  account
                </h3>
                {status === "authenticated" && session?.user?.id ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={accountDisplayName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${currentTheme.sub}22`,
                            border: `1px solid ${currentTheme.sub}33`
                          }}
                        >
                          <CircleUser size={16} style={{ color: currentTheme.sub }} />
                        </div>
                      )}
                      <span className="text-xs" style={{ color: currentTheme.foreground }}>
                        {accountDisplayName}
                      </span>
                    </div>
                    <div className="mb-3 space-y-1">
                      <p className="text-[11px] leading-4" style={{ color: currentTheme.sub }}>
                        created: {accountCreatedLabel}
                      </p>
                      <p className="text-[11px] leading-4" style={{ color: currentTheme.sub }}>
                        last sync: {lastSyncLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-xs px-3 py-2 rounded-lg transition-all duration-200"
                      style={{
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.sub}22`,
                        border: `1px solid ${currentTheme.sub}33`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = currentTheme.incorrect;
                        e.currentTarget.style.border = `1px solid ${currentTheme.incorrect}88`;
                        e.currentTarget.style.boxShadow = `0 0 18px ${currentTheme.incorrect}55`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = currentTheme.foreground;
                        e.currentTarget.style.border = `1px solid ${currentTheme.sub}33`;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      sign out
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs mb-2" style={{ color: currentTheme.sub }}>
                      sign in with discord (identify only).
                    </p>
                    <button
                      onClick={() => signIn("discord")}
                      className="w-full text-xs px-3 py-2 rounded-lg"
                      style={{
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.primary}22`,
                        border: `1px solid ${currentTheme.primary}55`
                      }}
                    >
                      sign in with discord
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* Stats panel */}
            <motion.button
              onClick={toggleStatsPanel}
              className="p-3 rounded-xl glass transition-all duration-300"
              style={{ color: currentTheme.sub }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = currentTheme.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.sub;
              }}
              title="open statistics"
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = currentTheme.sub;
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
                placeholder="type a language..."
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
                      languageOptionRefs.current[index] = element;
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
                    {getLanguageDisplayName(key).toLowerCase()}
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-sm" style={{ color: currentTheme.sub }}>
                  no languages found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {showGameModePicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: `${currentTheme.background}cc` }}
            onClick={() => setShowGameModePicker(false)}
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
                value={gameModeQuery}
                onChange={(e) => setGameModeQuery(e.target.value)}
                placeholder="type a game mode..."
                autoFocus
                className="w-full bg-transparent outline-none"
                style={{ color: currentTheme.foreground }}
              />
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {filteredGameModes.length > 0 ? (
                filteredGameModes.map((modeOption, index) => (
                  <button
                    key={modeOption.key}
                    ref={(element) => {
                      gameModeOptionRefs.current[index] = element;
                    }}
                    className="w-full text-left px-4 py-2 transition-colors"
                    style={{
                      color: currentTheme.foreground,
                      backgroundColor: index === highlightedGameModeIndex ? currentTheme.secondary : "transparent"
                    }}
                    onMouseEnter={(e) => {
                      setHighlightedGameModeIndex(index);
                      e.currentTarget.style.backgroundColor = currentTheme.secondary;
                    }}
                    onMouseLeave={(e) => {
                      if (index !== highlightedGameModeIndex) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                    onClick={() => {
                      setGameMode(modeOption.key as "normal" | "spell-ladder");
                      if (modeOption.key === "normal") {
                        resetTest();
                      }
                      setShowGameModePicker(false);
                      setGameModeQuery("");
                    }}
                  >
                    {modeOption.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-sm" style={{ color: currentTheme.sub }}>
                  no game modes found
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
