"use client";

import { useEffect, useRef, useState } from "react";
import { useTypingStore, type GameMode } from "@/lib/store";
import { themes } from "@/lib/themes";
import { languages, getLanguageDisplayName, LanguageKey } from "@/lib/words";
import { motion } from "framer-motion";
import { Settings, BarChart3, Languages, CircleUser, Gamepad2 } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { PickerModal } from "./picker-modal";

const GAME_MODES: { key: GameMode; label: string }[] = [
  { key: "normal", label: "normal" },
  { key: "spell-ladder", label: "spell ladder" },
];

const LANGUAGE_OPTIONS = (Object.keys(languages) as LanguageKey[]).map((key) => ({
  key,
  label: getLanguageDisplayName(key).toLowerCase(),
}));

const iconButtonClass =
  "p-3 rounded-xl glass transition-all duration-300 text-(--theme-sub) hover:text-(--theme-primary)";
const pillButtonClass =
  "flex items-center gap-2 px-3 py-2 rounded-xl glass transition-all duration-300 text-(--theme-fg) hover:text-(--theme-primary) " +
  "[text-shadow:0_0_8px_color-mix(in_srgb,var(--theme-primary)_33%,transparent)] " +
  "hover:[text-shadow:0_0_14px_color-mix(in_srgb,var(--theme-primary)_67%,transparent)]";

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
    requestSpellLadderReset,
    cloudLastSyncedAt,
    cloudJoinedAt,
  } = useTypingStore();
  const { data: session, status } = useSession();

  const currentTheme = themes[theme];
  const [openPicker, setOpenPicker] = useState<"language" | "game-mode" | null>(null);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);

  const currentGameModeLabel = GAME_MODES.find((option) => option.key === gameMode)?.label ?? "normal";

  useEffect(() => {
    if (!showAccountPanel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowAccountPanel(false);
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!accountPanelRef.current?.contains(event.target as Node)) setShowAccountPanel(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [showAccountPanel]);

  const user = session?.user;
  const accountDisplayName = user?.username ?? user?.globalName ?? user?.name ?? user?.id ?? "unknown user";

  const handleLogoReset = () => {
    if (gameMode === "spell-ladder") {
      requestSpellLadderReset();
    } else {
      resetTest();
    }
  };

  const selectGameMode = (key: string) => {
    setGameMode(key as GameMode);
    if (key === "normal") resetTest();
  };

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
          <button onClick={handleLogoReset} className="flex items-center gap-4 group" title="restart">
            <motion.div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})` }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl relative z-10" role="img" aria-label="penguin">
                🐧
              </span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
              />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: currentTheme.foreground }}>
              pengutype
            </h1>
          </button>

          {/* Centered game mode + language selector */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.button
              onClick={() => setOpenPicker("game-mode")}
              className={pillButtonClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="select game mode"
            >
              <Gamepad2 size={20} />
              <span className="text-sm font-medium tracking-wide">{currentGameModeLabel}</span>
            </motion.button>

            <motion.button
              onClick={() => setOpenPicker("language")}
              className={pillButtonClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="select language"
            >
              <Languages size={20} />
              <span className="text-sm font-medium tracking-wide">{getLanguageDisplayName(language).toLowerCase()}</span>
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 relative" ref={accountPanelRef}>
            <motion.button
              onClick={() => setShowAccountPanel((prev) => !prev)}
              className={iconButtonClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
                {status === "authenticated" && user?.id ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {user.image ? (
                        <img src={user.image} alt={accountDisplayName} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${currentTheme.sub}22`, border: `1px solid ${currentTheme.sub}33` }}
                        >
                          <CircleUser size={16} style={{ color: currentTheme.sub }} />
                        </div>
                      )}
                      <span className="text-xs" style={{ color: currentTheme.foreground }}>
                        {accountDisplayName}
                      </span>
                    </div>
                    <div className="mb-3 space-y-1 text-[11px] leading-4" style={{ color: currentTheme.sub }}>
                      <p>created: {cloudJoinedAt ? new Date(cloudJoinedAt).toLocaleDateString() : "unknown"}</p>
                      <p>last sync: {cloudLastSyncedAt ? new Date(cloudLastSyncedAt).toLocaleString() : "never"}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-xs px-3 py-2 rounded-lg border transition-all duration-200 text-(--theme-fg) bg-(--theme-sub)/15 border-(--theme-sub)/20 hover:text-[#bf616a] hover:border-[#bf616a88] hover:shadow-[0_0_18px_#bf616a55]"
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

            <motion.button
              onClick={toggleStatsPanel}
              className={iconButtonClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="open statistics"
            >
              <BarChart3 size={20} />
            </motion.button>

            <motion.button
              onClick={toggleSettings}
              className={iconButtonClass}
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              title="open settings"
            >
              <Settings size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {openPicker === "language" && (
        <PickerModal
          options={LANGUAGE_OPTIONS}
          placeholder="type a language..."
          emptyText="no languages found"
          onSelect={(key) => setLanguage(key as LanguageKey)}
          onClose={() => setOpenPicker(null)}
          theme={currentTheme}
        />
      )}

      {openPicker === "game-mode" && (
        <PickerModal
          options={GAME_MODES}
          placeholder="type a game mode..."
          emptyText="no game modes found"
          onSelect={selectGameMode}
          onClose={() => setOpenPicker(null)}
          theme={currentTheme}
        />
      )}
    </>
  );
}
