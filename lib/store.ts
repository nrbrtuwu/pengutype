import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRandomWords } from '@/lib/words';
import { FONTS, DEFAULT_FONT, type FontKey } from '@/lib/fonts';
import { languages } from '@/languages';
import type { LanguageKey } from '@/languages';
import { MODS, type ModKey } from './mods';
import { DEFAULT_THEME, LEGACY_THEME_KEYS, ThemeKey, themes } from './themes';
import { calculateCharacterStats, calculatePerformanceStats, calculateSeparatorStats, validateTestAttempt, type TypedCharacter } from './typing-metrics';

export type TestMode = 'time' | 'words';
export type GameMode = 'normal' | 'spell-ladder';
export type SpellingRepeatMode = 'single' | 'infinite';
export type TimeOption = 15 | 30 | 60 | 120;
export type WordOption = 10 | 25 | 50 | 100;
export type RestartKeybind = 'tab-enter' | 'tab';
export type CaretStyle = 'line' | 'block' | 'underline';
export type PaceCaret = 'off' | 'pb' | 'average' | 'custom';
export type StopOnError = 'off' | 'letter' | 'word';
export type ConfidenceMode = 'off' | 'on' | 'max';
export type IndicateTypos = 'off' | 'below' | 'replace';
export type KeySound = 'off' | 'click' | 'pop' | 'typewriter';
export type ReduceMotion = 'auto' | 'on' | 'off';
export type RandomTheme = 'off' | 'test' | 'day';

/** Quality-of-life preferences, changed through updateSettings(). */
export interface QolSettings {
  caretStyle: CaretStyle;
  /** lines of words visible in the typing area */
  visibleLines: 2 | 3 | 4;
  /** hide mistakes while typing */
  blindMode: boolean;
  /** allow backspacing into words that were typed correctly */
  freedomMode: boolean;
  /** hide header/footer while typing; mouse movement brings them back */
  focusMode: boolean;
  showLiveTimer: boolean;
  showLiveWpm: boolean;
  showLiveAccuracy: boolean;
  showConfetti: boolean;

  /** ghost caret moving at a target speed */
  paceCaret: PaceCaret;
  paceCaretWpm: number;
  /** letter: wrong keys aren't typed (still count as mistakes); word: space only advances from a correct word */
  stopOnError: StopOnError;
  /** on: can't go back to previous words; max: backspace disabled */
  confidenceMode: ConfidenceMode;
  /** space only advances once every letter of the word is typed */
  strictSpace: boolean;
  /** show the letter that was actually typed for mistakes */
  indicateTypos: IndicateTypos;
  /** fail the test when live wpm/accuracy drop below these (0 = off) */
  minWpm: number;
  minAccuracy: number;
  keySound: KeySound;
  errorSound: boolean;
  /** 0..1 */
  soundVolume: number;

  /** switch between lightTheme and darkTheme with the OS color scheme */
  followSystemTheme: boolean;
  lightTheme: ThemeKey;
  darkTheme: ThemeKey;
  randomTheme: RandomTheme;
  reduceMotion: ReduceMotion;
  /** one line of words that scrolls sideways */
  tapeMode: boolean;
  showProgressBar: boolean;
  showKeymap: boolean;
  font: FontKey;
}

const DEFAULT_QOL_SETTINGS: QolSettings = {
  caretStyle: 'line',
  visibleLines: 3,
  blindMode: false,
  freedomMode: true,
  focusMode: false,
  showLiveTimer: true,
  showLiveWpm: true,
  showLiveAccuracy: true,
  showConfetti: true,

  paceCaret: 'off',
  paceCaretWpm: 100,
  stopOnError: 'off',
  confidenceMode: 'off',
  strictSpace: false,
  indicateTypos: 'off',
  minWpm: 0,
  minAccuracy: 0,
  keySound: 'off',
  errorSound: false,
  soundVolume: 0.5,

  followSystemTheme: false,
  lightTheme: 'penguin_light',
  darkTheme: 'penguin',
  randomTheme: 'off',
  reduceMotion: 'auto',
  tapeMode: false,
  showProgressBar: false,
  showKeymap: false,
  font: 'jetbrains_mono',
};

export const TIME_OPTIONS: TimeOption[] = [15, 30, 60, 120];
export const WORD_OPTIONS: WordOption[] = [10, 25, 50, 100];

export interface TestResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  time: number;
  mode: TestMode;
  language: LanguageKey;
  timeOption?: TimeOption;
  wordOption?: WordOption;
  isValid?: boolean;
  invalidReason?: string;
  /** active mods; runs with mods aren't recorded */
  mods?: ModKey[];
  timestamp: number;
}

export interface SpellLadderResult {
  repeatMode: SpellingRepeatMode;
  language: LanguageKey;
  timeOption: TimeOption;
  completedWords: number;
  elapsedSeconds: number;
  isCompleted: boolean;
  isValid: boolean;
  timestamp: number;
}

interface TypingState extends QolSettings {
  // Settings
  gameMode: GameMode;
  spellingRepeatMode: SpellingRepeatMode;
  mode: TestMode;
  timeOption: TimeOption;
  wordOption: WordOption;
  language: LanguageKey;
  theme: ThemeKey;
  smoothCaret: boolean;
  fontSize: number;
  restartKeybind: RestartKeybind;
  mods: ModKey[];

  // Test state
  isTestActive: boolean;
  isTestComplete: boolean;
  currentWordIndex: number;
  words: string[];
  typedChars: TypedCharacter[][];
  startTime: number | null;
  timeLeft: number;
  /** Retry mode: replays the same words and doesn't record the result. */
  suppressResultRecording: boolean;
  /** wrong keys rejected by stop-on-error (letter); counted as mistakes */
  rejectedKeys: number;
  currentResult: TestResult | null;
  invalidationNotice: { id: number; reason: string } | null;
  spellLadderStarted: boolean;
  /** Bumped to ask the spell ladder to build a new round. */
  spellLadderResetRequest: number;

  // History
  results: TestResult[];
  spellLadderResults: SpellLadderResult[];

  // UI
  showCommandPalette: boolean;
  cloudLastSyncedAt: number | null;
  cloudJoinedAt: string | null;
  hasHydrated: boolean;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setSpellingRepeatMode: (mode: SpellingRepeatMode) => void;
  setMode: (mode: TestMode) => void;
  setTimeOption: (time: TimeOption) => void;
  setWordOption: (words: WordOption) => void;
  setLanguage: (language: LanguageKey) => void;
  setTheme: (theme: ThemeKey) => void;
  setSmoothCaret: (smooth: boolean) => void;
  setFontSize: (size: number) => void;
  setRestartKeybind: (keybind: RestartKeybind) => void;
  updateSettings: (settings: Partial<QolSettings>) => void;
  /** `failReason` ends the test as a fail (e.g. sudden death) */
  endTest: (failReason?: string) => void;
  toggleMod: (mod: ModKey) => void;
  clearMods: () => void;
  resetTest: () => void;
  exitRetryMode: () => void;
  retryCurrentTest: () => void;
  handleKeyPress: (key: string) => void;
  updateTimeLeft: (time: number) => void;
  toggleCommandPalette: () => void;
  setCloudLastSyncedAt: (timestamp: number | null) => void;
  setCloudJoinedAt: (joinedAt: string | null) => void;
  setHasHydrated: () => void;
  mergeResults: (incomingResults: TestResult[]) => void;
  mergeSpellLadderResults: (incomingResults: SpellLadderResult[]) => void;
  addSpellLadderResult: (result: SpellLadderResult) => void;
  clearHistory: () => void;
  setInvalidationNotice: (reason: string) => void;
  clearInvalidationNotice: () => void;
  setSpellLadderStarted: (started: boolean) => void;
  requestSpellLadderReset: () => void;
}

/** Identity of a test for de-duplication. Cloud copies lack isValid and have rounded times, so only stable fields are used. */
function resultIdentity(result: TestResult): string {
  return `${result.timestamp}|${result.mode}|${result.language}`;
}

function pickQolSettings(state: QolSettings): QolSettings {
  const keys = Object.keys(DEFAULT_QOL_SETTINGS) as (keyof QolSettings)[];
  return Object.fromEntries(keys.map((key) => [key, state[key]])) as unknown as QolSettings;
}

function isWordCorrect(word: string | undefined, typed: TypedCharacter[] | undefined): boolean {
  return !!word && !!typed && typed.length === word.length && typed.every((c) => c.correct && !c.extra);
}

function freshTest(words: string[], timeOption: TimeOption, suppressResultRecording: boolean) {
  return {
    isTestActive: false,
    isTestComplete: false,
    currentWordIndex: 0,
    words,
    typedChars: words.map((): TypedCharacter[] => []),
    startTime: null,
    timeLeft: timeOption,
    suppressResultRecording,
    rejectedKeys: 0,
    currentResult: null,
    invalidationNotice: null,
  };
}

export const useTypingStore = create<TypingState>()(
  persist(
    (set, get) => {
      const newWords = () => {
        const { language, mode, wordOption } = get();
        return getRandomWords(language, mode === 'time' ? 200 : wordOption);
      };

      return {
        gameMode: 'normal',
        spellingRepeatMode: 'infinite',
        mode: 'time',
        timeOption: 30,
        wordOption: 25,
        language: 'english',
        theme: DEFAULT_THEME,
        smoothCaret: true,
        fontSize: 24,
        restartKeybind: 'tab-enter',
        ...DEFAULT_QOL_SETTINGS,
        mods: [],

        ...freshTest([], 30, false),
        spellLadderStarted: false,
        spellLadderResetRequest: 0,

        results: [],
        spellLadderResults: [],

        showCommandPalette: false,
        cloudLastSyncedAt: null,
        cloudJoinedAt: null,
        hasHydrated: false,

        setGameMode: (gameMode) => set({ gameMode }),
        setSpellingRepeatMode: (spellingRepeatMode) => set({ spellingRepeatMode }),
        setMode: (mode) => set({ mode }),
        setTimeOption: (timeOption) => set({ timeOption, timeLeft: timeOption }),
        setWordOption: (wordOption) => set({ wordOption }),
        setLanguage: (language) => set({ language }),
        setTheme: (theme) => set({ theme }),
        setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
        setFontSize: (fontSize) => set({ fontSize }),
        setRestartKeybind: (restartKeybind) => set({ restartKeybind }),
        updateSettings: (settings) => set(settings),
        clearMods: () => set({ mods: [] }),
        toggleMod: (mod) =>
          set((state) => ({
            mods: state.mods.includes(mod)
              ? state.mods.filter((m) => m !== mod)
              : [...state.mods, mod],
          })),

        endTest: (failReason) => {
          const state = get();
          const elapsedSeconds = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
          const testDurationSeconds = state.mode === 'time'
            ? Math.min(state.timeOption, Math.max(0.001, elapsedSeconds || state.timeOption))
            : Math.max(0.001, elapsedSeconds);

          const characterStats = calculateCharacterStats(state.words, state.typedChars, state.currentWordIndex);
          characterStats.incorrectChars += state.rejectedKeys;
          const separatorStats = calculateSeparatorStats(state.words, state.typedChars, state.currentWordIndex);
          const performanceStats = calculatePerformanceStats(characterStats, testDurationSeconds, 0, {
            additionalCorrectChars: separatorStats.correctSeparators,
            additionalTypedChars: separatorStats.typedSeparators,
          });
          const validation = failReason
            ? { isValid: false, reason: failReason }
            : validateTestAttempt(state.words, state.typedChars, characterStats, separatorStats, {
                elapsedSeconds: testDurationSeconds,
                accuracy: performanceStats.accuracy,
              });

          const result: TestResult = {
            wpm: validation.isValid ? performanceStats.wpm : 0,
            rawWpm: validation.isValid ? performanceStats.rawWpm : 0,
            accuracy: validation.isValid ? performanceStats.accuracy : 0,
            ...characterStats,
            time: Number(testDurationSeconds.toFixed(2)),
            mode: state.mode,
            language: state.language,
            timeOption: state.mode === 'time' ? state.timeOption : undefined,
            wordOption: state.mode === 'words' ? state.wordOption : undefined,
            isValid: validation.isValid,
            invalidReason: validation.reason ?? undefined,
            mods: state.mods.length > 0 ? state.mods : undefined,
            timestamp: Date.now()
          };

          // Retries and mod runs are unranked
          const shouldRecordResult = !state.suppressResultRecording && validation.isValid && state.mods.length === 0;

          set({
            isTestActive: false,
            isTestComplete: true,
            currentResult: result,
            results: shouldRecordResult ? [...state.results, result] : state.results,
            suppressResultRecording: false,
            invalidationNotice: validation.reason
              ? { id: Date.now(), reason: validation.reason }
              : state.invalidationNotice
          });
        },

        // In retry mode, restarting replays the same words
        resetTest: () => {
          const { suppressResultRecording, words, timeOption } = get();
          const keepWords = suppressResultRecording && words.length > 0;
          set(freshTest(keepWords ? words : newWords(), timeOption, suppressResultRecording));
        },

        exitRetryMode: () => set(freshTest(newWords(), get().timeOption, false)),

        retryCurrentTest: () => {
          const { words, timeOption } = get();
          set(freshTest(words.length > 0 ? words : newWords(), timeOption, true));
        },

        handleKeyPress: (key) => {
          const state = get();

          if (state.isTestComplete) return;

          // Start test on first keypress
          if (!state.isTestActive && key.length === 1) {
            set({ isTestActive: true, startTime: Date.now() });
          }

          const currentWord = state.words[state.currentWordIndex];
          if (!currentWord) return;

          const newTypedChars = [...state.typedChars];
          const currentWordChars = [...(newTypedChars[state.currentWordIndex] || [])];
          newTypedChars[state.currentWordIndex] = currentWordChars;

          if (key === 'Backspace') {
            if (state.confidenceMode === 'max') return;

            const previousWordIndex = state.currentWordIndex - 1;
            const canGoBack =
              previousWordIndex >= 0 &&
              state.confidenceMode === 'off' &&
              // without freedom mode, only back into a mistyped word
              (state.freedomMode || !isWordCorrect(state.words[previousWordIndex], newTypedChars[previousWordIndex]));

            if (currentWordChars.length > 0) {
              currentWordChars.pop();
              set({ typedChars: newTypedChars });
            } else if (canGoBack) {
              set({ currentWordIndex: previousWordIndex, typedChars: newTypedChars });
            }
          } else if (key === ' ') {
            // Move to next word if current word has characters
            if (currentWordChars.length > 0) {
              if (state.strictSpace && currentWordChars.length < currentWord.length) return;
              if (state.stopOnError === 'word' && !isWordCorrect(currentWord, currentWordChars)) return;

              if (state.mods.includes('sudden-death') && currentWordChars.length < currentWord.length) {
                get().endTest('sudden death: skipped letters');
                return;
              }

              const nextWordIndex = state.currentWordIndex + 1;

              if (state.mode === 'words' && nextWordIndex >= state.wordOption) {
                // move past the last word so letters skipped with space count as missed
                set({ currentWordIndex: nextWordIndex, typedChars: newTypedChars });
                get().endTest();
                return;
              }

              newTypedChars[nextWordIndex] ??= [];
              set({ currentWordIndex: nextWordIndex, typedChars: newTypedChars });
            }
          } else if (key.length === 1) {
            const charIndex = currentWordChars.length;
            const isExtra = charIndex >= currentWord.length;
            const isWrong = isExtra || key !== currentWord[charIndex];

            // stop on error (letter): wrong keys aren't typed, but still count as mistakes
            if (state.stopOnError === 'letter' && isWrong) {
              if (state.mods.includes('sudden-death')) {
                get().endTest('sudden death: wrong letter');
              } else {
                set({ rejectedKeys: state.rejectedKeys + 1 });
              }
              return;
            }

            currentWordChars.push({
              char: key,
              correct: !isExtra && key === currentWord[charIndex],
              extra: isExtra
            });

            set({ typedChars: newTypedChars });

            const lastTyped = currentWordChars[currentWordChars.length - 1];
            if (state.mods.includes('sudden-death') && (!lastTyped.correct || lastTyped.extra)) {
              get().endTest('sudden death: wrong letter');
              return;
            }

            const isLastWordInWordsMode =
              state.mode === 'words' && state.currentWordIndex >= state.wordOption - 1;
            if (isLastWordInWordsMode && currentWordChars.length >= currentWord.length) {
              get().endTest();
            }
          }
        },

        updateTimeLeft: (time) => {
          set({ timeLeft: time });
          if (time <= 0 && get().isTestActive) {
            get().endTest();
          }
        },

        toggleCommandPalette: () => set((state) => ({ showCommandPalette: !state.showCommandPalette })),
        setCloudLastSyncedAt: (cloudLastSyncedAt) => set({ cloudLastSyncedAt }),
        setCloudJoinedAt: (cloudJoinedAt) => set({ cloudJoinedAt }),
        setHasHydrated: () => set({ hasHydrated: true }),
        mergeResults: (incomingResults) =>
          set((state) => {
            const map = new Map(state.results.map((result) => [resultIdentity(result), result]));
            let added = false;

            for (const result of incomingResults) {
              const key = resultIdentity(result);
              if (!map.has(key)) {
                map.set(key, result);
                added = true;
              }
            }

            if (!added) return state;
            return { results: [...map.values()].sort((a, b) => a.timestamp - b.timestamp) };
          }),
        mergeSpellLadderResults: (incomingResults) =>
          set((state) => {
            const seen = new Set(state.spellLadderResults.map((result) => result.timestamp));
            const added = incomingResults.filter((result) => !seen.has(result.timestamp));
            if (added.length === 0) return state;
            return { spellLadderResults: [...state.spellLadderResults, ...added].sort((a, b) => a.timestamp - b.timestamp) };
          }),
        addSpellLadderResult: (result) => set((state) => ({ spellLadderResults: [...state.spellLadderResults, result] })),
        clearHistory: () => set({ results: [], spellLadderResults: [] }),
        setInvalidationNotice: (reason) => set({ invalidationNotice: { id: Date.now(), reason } }),
        clearInvalidationNotice: () => set({ invalidationNotice: null }),
        setSpellLadderStarted: (spellLadderStarted) => set({ spellLadderStarted }),
        requestSpellLadderReset: () => set((state) => ({ spellLadderResetRequest: state.spellLadderResetRequest + 1 }))
      };
    },
    {
      name: 'pengutype-storage',
      merge: (persistedState, currentState) => {
        const incoming = (persistedState ?? {}) as Partial<Omit<TypingState, 'gameMode' | 'theme'>> & { gameMode?: string; theme?: string };
        const merged = { ...currentState, ...incoming };
        const incomingTheme = incoming.theme && (LEGACY_THEME_KEYS[incoming.theme] ?? incoming.theme);

        return {
          ...merged,
          // removed themes fall back to the default
          theme: incomingTheme && incomingTheme in themes ? (incomingTheme as ThemeKey) : currentState.theme,
          language: incoming.language && incoming.language in languages ? incoming.language : currentState.language,
          // legacy name
          gameMode: (incoming.gameMode === 'spell-climb' ? 'spell-ladder' : merged.gameMode) as GameMode,
          // older versions stored duplicate cloud copies of the same test
          results: dedupeResults(merged.results ?? []),
          mods: (merged.mods ?? []).filter((mod) => mod in MODS),
          lightTheme: merged.lightTheme in themes ? merged.lightTheme : DEFAULT_QOL_SETTINGS.lightTheme,
          darkTheme: merged.darkTheme in themes ? merged.darkTheme : DEFAULT_QOL_SETTINGS.darkTheme,
          font: merged.font in FONTS ? merged.font : DEFAULT_FONT,
        };
      },
      partialize: (state) => ({
        gameMode: state.gameMode,
        spellingRepeatMode: state.spellingRepeatMode,
        mode: state.mode,
        timeOption: state.timeOption,
        wordOption: state.wordOption,
        language: state.language,
        theme: state.theme,
        smoothCaret: state.smoothCaret,
        fontSize: state.fontSize,
        restartKeybind: state.restartKeybind,
        ...pickQolSettings(state),
        mods: state.mods,
        results: state.results,
        spellLadderResults: state.spellLadderResults
      }),
      // runs synchronously inside create(), so useTypingStore isn't assigned yet
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      }
    }
  )
);

function dedupeResults(results: TestResult[]): TestResult[] {
  const map = new Map<string, TestResult>();
  for (const result of results) {
    const key = resultIdentity(result);
    // prefer the local copy (it carries isValid and precise time)
    if (!map.has(key) || result.isValid !== undefined) {
      map.set(key, result);
    }
  }
  return [...map.values()];
}
