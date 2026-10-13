"use client";

import { useEffect, useRef, useState } from "react";
import { useTypingStore, type GameMode } from "@/lib/store";
import { languages, getLanguageDisplayName, LanguageKey } from "@/lib/words";
import { Settings, BarChart3, Languages, CircleUser, Gamepad2, Sparkles } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PickerModal } from "./picker-modal";
import { formatMods } from "@/lib/mods";

const GAME_MODES: { key: GameMode; label: string }[] = [
  { key: "normal", label: "normal" },
  { key: "spell-ladder", label: "spell ladder" },
];

const LANGUAGE_OPTIONS = (Object.keys(languages) as LanguageKey[]).map((key) => ({
  key,
  label: getLanguageDisplayName(key).toLowerCase(),
}));

const navButtonClass = "flex items-center gap-2 p-2 rounded-lg whitespace-nowrap text-sub hover:text-text transition-colors";

export function Header() {
  const {
    gameMode,
    setGameMode,
    setLanguage,
    language,
    resetTest,
    requestSpellLadderReset,
    cloudLastSyncedAt,
    cloudJoinedAt,
    mods,
  } = useTypingStore();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

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

  const handleLogoClick = () => {
    if (pathname !== "/") {
      router.push("/");
    } else if (gameMode === "spell-ladder") {
      requestSpellLadderReset();
    } else {
      resetTest();
    }
  };

  const selectGameMode = (key: string) => {
    setGameMode(key as GameMode);
    if (key === "normal") resetTest();
    router.push("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 px-6 py-5 bg-bg transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between relative">
          <button onClick={handleLogoClick} className="flex items-center gap-2 group" title={pathname === "/" ? "restart" : "back to test"}>
            <span className="text-3xl" role="img" aria-label="penguin">
              🐧
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-text">pengutype</h1>
          </button>

          {/* Centered game mode + language selector */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm">
            <button onClick={() => setOpenPicker("game-mode")} className={navButtonClass} title="select game mode">
              <Gamepad2 size={18} />
              {currentGameModeLabel}
            </button>
            <button onClick={() => setOpenPicker("language")} className={navButtonClass} title="select language">
              <Languages size={18} />
              {getLanguageDisplayName(language).toLowerCase()}
            </button>
            {/* reminder that fun modes are on (and runs are unranked) */}
            {mods.length > 0 && (
              <Link href="/settings#fun" className={`${navButtonClass} text-main!`} title="fun modes (unranked)">
                <Sparkles size={18} />
                {formatMods(mods)}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 relative" ref={accountPanelRef}>
            <button onClick={() => setShowAccountPanel((prev) => !prev)} className={navButtonClass} title="account">
              <CircleUser size={20} />
            </button>

            {showAccountPanel && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-60 rounded-lg p-4 z-50 bg-sub-alt text-sm">
                {status === "authenticated" && user?.id ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      {user.image ? (
                        <img src={user.image} alt={accountDisplayName} className="w-8 h-8 rounded-full" />
                      ) : (
                        <CircleUser size={32} className="text-sub" />
                      )}
                      <span className="text-text">{accountDisplayName}</span>
                    </div>
                    <div className="mb-3 space-y-1 text-xs text-sub">
                      <p>created: {cloudJoinedAt ? new Date(cloudJoinedAt).toLocaleDateString() : "unknown"}</p>
                      <p>last sync: {cloudLastSyncedAt ? new Date(cloudLastSyncedAt).toLocaleString() : "never"}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full px-3 py-2 rounded-lg bg-bg text-sub hover:text-error transition-colors"
                    >
                      sign out
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs mb-3 text-sub">sign in with discord to back up your personal bests.</p>
                    <button
                      onClick={() => signIn("discord")}
                      className="w-full px-3 py-2 rounded-lg bg-bg text-text hover:bg-main hover:text-bg transition-colors"
                    >
                      sign in with discord
                    </button>
                  </>
                )}
              </div>
            )}

            <Link href="/stats" className={`${navButtonClass} ${pathname === "/stats" ? "text-main!" : ""}`} title="statistics">
              <BarChart3 size={20} />
            </Link>
            <Link href="/settings" className={`${navButtonClass} ${pathname === "/settings" ? "text-main!" : ""}`} title="settings">
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </header>

      {openPicker === "language" && (
        <PickerModal
          options={LANGUAGE_OPTIONS}
          placeholder="type a language..."
          emptyText="no languages found"
          onSelect={(key) => setLanguage(key as LanguageKey)}
          onClose={() => setOpenPicker(null)}
        />
      )}

      {openPicker === "game-mode" && (
        <PickerModal
          options={GAME_MODES}
          placeholder="type a game mode..."
          emptyText="no game modes found"
          onSelect={selectGameMode}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </>
  );
}
