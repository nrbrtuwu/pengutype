"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  useTypingStore,
  type CaretStyle,
  type QolSettings,
  type RestartKeybind,
  type SpellLadderResult,
  type TestResult,
} from "@/lib/store";
import { MODS, MOD_KEYS, type Mod } from "@/lib/mods";
import { themes, type Theme, type ThemeKey } from "@/lib/themes";
import { PageContainer } from "@/components/app-shell";
import { Kbd } from "@/components/result-parts";

const FONT_SIZES = [16, 20, 24, 28, 32];
const RESTART_KEYBINDS: { key: RestartKeybind; label: string }[] = [
  { key: "tab-enter", label: "tab + enter" },
  { key: "tab", label: "tab" },
];

const CARET_STYLES: CaretStyle[] = ["line", "block", "underline"];
const VISIBLE_LINES: QolSettings["visibleLines"][] = [2, 3, 4];

const SECTIONS = [
  { id: "theme", label: "theme" },
  { id: "typing", label: "typing" },
  { id: "interface", label: "interface" },
  { id: "fun", label: "fun" },
  { id: "data", label: "data" },
];

function isLight(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

const themeEntries = Object.entries(themes) as [ThemeKey, Theme][];
const THEME_GROUPS = [
  { label: "dark", themes: themeEntries.filter(([, t]) => !isLight(t.bg)) },
  { label: "light", themes: themeEntries.filter(([, t]) => isLight(t.bg)) },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mb-16">
      <h2 className="text-2xl text-sub mb-6">{title}</h2>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

/** One setting: name + description on the left, control on the right. */
function Row({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[1fr_minmax(0,22rem)] gap-3 md:gap-8 items-center">
      <div>
        <h3 className="text-text">{title}</h3>
        <p className="text-sm text-sub">{description}</p>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-main text-bg" : "bg-sub-alt text-text hover:bg-text hover:text-bg"
      }`}
    >
      {children}
    </button>
  );
}

function ThemeButton({ themeKey, theme, active, onClick }: { themeKey: ThemeKey; theme: Theme; active: boolean; onClick: () => void }) {
  return (
    <button
      key={themeKey}
      onClick={onClick}
      className={`group flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-sm text-left ring-1 ring-sub/20 transition-transform hover:-translate-y-0.5 ${
        active ? "outline-2 outline-offset-2 outline-main" : ""
      }`}
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <span className="truncate" style={{ color: theme.main }}>
        {theme.name.toLowerCase()}
      </span>
      {active ? (
        <Check size={16} style={{ color: theme.main }} />
      ) : (
        <span className="flex gap-1 shrink-0">
          {[theme.main, theme.sub, theme.text].map((color) => (
            <span key={color} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </span>
      )}
    </button>
  );
}

/** Highlights the sidebar entry for the section currently in view. */
function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

/** osu!-style mod tile: a big square with the acronym; the name and description show on hover/focus. */
function ModTile({ mod, active, onClick }: { mod: Mod; active: boolean; onClick: () => void }) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        aria-pressed={active}
        aria-label={`${mod.name}: ${mod.description}`}
        className={`w-24 h-24 rounded-xl font-mono text-3xl font-bold transition-all duration-150 hover:-translate-y-1 ${
          active ? "bg-main text-bg" : "bg-sub-alt text-sub hover:text-text"
        }`}
      >
        {mod.acronym}
      </button>

      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-3 w-56 -translate-x-1/2 rounded-lg bg-text px-3 py-2 text-bg opacity-0 transition-opacity group-hover:opacity-100 group-has-focus-visible:opacity-100"
      >
        <div className="text-sm font-semibold">{mod.name}</div>
        <div className="text-xs">{mod.description}</div>
      </div>
    </div>
  );
}

function OnOff({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <>
      <Choice active={!value} onClick={() => onChange(false)}>
        off
      </Choice>
      <Choice active={value} onClick={() => onChange(true)}>
        on
      </Choice>
    </>
  );
}

type HistoryFile = { app: "pengutype"; version: 1; results: TestResult[]; spellLadderResults: SpellLadderResult[] };

function exportHistory(results: TestResult[], spellLadderResults: SpellLadderResult[]) {
  const data: HistoryFile = { app: "pengutype", version: 1, results, spellLadderResults };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `pengutype-history-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function readHistoryFile(file: File): Promise<HistoryFile> {
  const data = JSON.parse(await file.text()) as Partial<HistoryFile>;
  if (data.app !== "pengutype" || !Array.isArray(data.results) || !Array.isArray(data.spellLadderResults)) {
    throw new Error("not a pengutype history file");
  }
  return data as HistoryFile;
}

export default function SettingsPage() {
  const store = useTypingStore();
  const {
    theme,
    setTheme,
    smoothCaret,
    setSmoothCaret,
    fontSize,
    setFontSize,
    restartKeybind,
    setRestartKeybind,
    updateSettings,
    results,
    spellLadderResults,
    mergeResults,
    mergeSpellLadderResults,
    clearHistory,
    mods,
    toggleMod,
  } = store;
  const activeSection = useActiveSection();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const testCount = results.length + spellLadderResults.length;

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = await readHistoryFile(file);
      const countResults = () => useTypingStore.getState().results.length + useTypingStore.getState().spellLadderResults.length;
      const before = countResults();
      mergeResults(data.results);
      mergeSpellLadderResults(data.spellLadderResults);
      const added = countResults() - before;
      setImportMessage(`Imported ${added} new result${added === 1 ? "" : "s"}.`);
    } catch {
      setImportMessage("Couldn't read that file. Is it a pengutype history export?");
    }
  };

  return (
    <PageContainer>
      <div className="grid md:grid-cols-[11rem_1fr] gap-10 md:gap-16">
        <aside className="hidden md:block">
          <nav className="sticky top-28 flex flex-col gap-1">
            <h1 className="text-3xl text-text mb-6">settings</h1>
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`py-1.5 pl-3 border-l-2 transition-colors ${
                  activeSection === section.id ? "border-main text-text" : "border-sub-alt text-sub hover:text-text"
                }`}
              >
                {section.label}
              </a>
            ))}
            <p className="mt-8 text-xs text-sub">
              <Kbd>esc</Kbd> back to test
            </p>
          </nav>
        </aside>

        <div>
          <h1 className="md:hidden text-3xl text-text mb-10">settings</h1>

          <Section id="theme" title="theme">
            {THEME_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm text-sub mb-3">{group.label}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.themes.map(([key, t]) => (
                    <ThemeButton key={key} themeKey={key} theme={t} active={theme === key} onClick={() => setTheme(key)} />
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section id="typing" title="typing">
            <Row title="font size" description="Size of the words in the typing test.">
              {FONT_SIZES.map((size) => (
                <Choice key={size} active={fontSize === size} onClick={() => setFontSize(size)}>
                  {size}
                </Choice>
              ))}
            </Row>

            <Row title="caret style" description="Shape of the caret that marks your position.">
              {CARET_STYLES.map((style) => (
                <Choice key={style} active={store.caretStyle === style} onClick={() => updateSettings({ caretStyle: style })}>
                  {style}
                </Choice>
              ))}
            </Row>

            <Row title="smooth caret" description="Glide the caret between letters instead of jumping.">
              <OnOff value={smoothCaret} onChange={setSmoothCaret} />
            </Row>

            <Row title="visible lines" description="How many lines of words are shown at once.">
              {VISIBLE_LINES.map((lines) => (
                <Choice key={lines} active={store.visibleLines === lines} onClick={() => updateSettings({ visibleLines: lines })}>
                  {lines}
                </Choice>
              ))}
            </Row>

            <Row title="blind mode" description="Don't highlight mistakes while typing. Results still count them.">
              <OnOff value={store.blindMode} onChange={(blindMode) => updateSettings({ blindMode })} />
            </Row>

            <Row title="freedom mode" description="Allow backspacing into words you already typed correctly.">
              <OnOff value={store.freedomMode} onChange={(freedomMode) => updateSettings({ freedomMode })} />
            </Row>

            <Row title="restart shortcut" description="Keys that restart the current test.">
              {RESTART_KEYBINDS.map((option) => (
                <Choice key={option.key} active={restartKeybind === option.key} onClick={() => setRestartKeybind(option.key)}>
                  {option.label}
                </Choice>
              ))}
            </Row>
          </Section>

          <Section id="interface" title="interface">
            <Row title="focus mode" description="Hide the header and footer while typing. Move the mouse to bring them back.">
              <OnOff value={store.focusMode} onChange={(focusMode) => updateSettings({ focusMode })} />
            </Row>

            <Row title="live stats" description="What to show above the words during a test.">
              <Choice active={store.showLiveTimer} onClick={() => updateSettings({ showLiveTimer: !store.showLiveTimer })}>
                timer
              </Choice>
              <Choice active={store.showLiveWpm} onClick={() => updateSettings({ showLiveWpm: !store.showLiveWpm })}>
                wpm
              </Choice>
              <Choice
                active={store.showLiveAccuracy}
                onClick={() => updateSettings({ showLiveAccuracy: !store.showLiveAccuracy })}
              >
                accuracy
              </Choice>
            </Row>

            <Row title="confetti" description="Celebrate new personal bests with confetti.">
              <OnOff value={store.showConfetti} onChange={(showConfetti) => updateSettings({ showConfetti })} />
            </Row>
          </Section>

          <Section id="fun" title="fun">
            <p className="text-sm text-sub -mt-4">
              Runs with any of these on are unranked: they aren&apos;t saved to history or personal bests.
            </p>
            <div className="flex flex-wrap gap-3">
              {MOD_KEYS.map((key) => (
                <ModTile key={key} mod={MODS[key]} active={mods.includes(key)} onClick={() => toggleMod(key)} />
              ))}
            </div>
          </Section>

          <Section id="data" title="data">
            <Row title="export history" description="Download all your local results as a JSON file.">
              <Choice active={false} onClick={() => exportHistory(results, spellLadderResults)}>
                export
              </Choice>
            </Row>

            <Row title="import history" description={importMessage ?? "Load results from an exported file. Duplicates are skipped."}>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  void handleImport(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Choice active={false} onClick={() => importInputRef.current?.click()}>
                import
              </Choice>
            </Row>

            <Row
              title="clear history"
              description={`Delete all ${testCount} locally saved test result${testCount === 1 ? "" : "s"}. Cloud backups are not affected.`}
            >
              <button
                onClick={() => {
                  if (confirm("are you sure you want to clear all history?")) clearHistory();
                }}
                disabled={testCount === 0}
                className="flex-1 py-2 rounded-lg text-sm bg-sub-alt text-error hover:bg-error hover:text-bg transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                clear history
              </button>
            </Row>
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
