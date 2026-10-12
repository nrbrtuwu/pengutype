import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRandomWords } from '@/lib/words';
import { languages } from '@/languages';
import type { LanguageKey } from '@/languages';
import { ThemeKey, themes } from './themes';
import { calculateCharacterStats, calculatePerformanceStats, calculateSeparatorStats, validateTestAttempt, type TypedCharacter } from './typing-metrics';

export type TestMode = 'time' | 'words';
export type GameMode = 'normal' | 'spell-ladder';
export type SpellingRepeatMode = 'single' | 'infinite';
export type TimeOption = 15 | 30 | 60 | 120;
export type WordOption = 10 | 25 | 50 | 100;
export type RestartKeybind = 'tab-enter' | 'tab';

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

interface TypingState {
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
  currentResult: TestResult | null;
  invalidationNotice: { id: number; reason: string } | null;
  spellLadderStarted: boolean;
  /** Bumped to ask the spell ladder to build a new round. */
  spellLadderResetRequest: number;

  // History
  results: TestResult[];
  spellLadderResults: SpellLadderResult[];

  // UI
  showSettings: boolean;
  showCommandPalette: boolean;
  showStatsPanel: boolean;
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
  endTest: () => void;
  resetTest: () => void;
  exitRetryMode: () => void;
  retryCurrentTest: () => void;
  handleKeyPress: (key: string) => void;
  updateTimeLeft: (time: number) => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
  toggleCommandPalette: () => void;
  toggleStatsPanel: () => void;
  setShowStatsPanel: (show: boolean) => void;
  setCloudLastSyncedAt: (timestamp: number | null) => void;
  setCloudJoinedAt: (joinedAt: string | null) => void;
  setHasHydrated: () => void;
  mergeResults: (incomingResults: TestResult[]) => void;
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
        theme: 'aurora',
        smoothCaret: true,
        fontSize: 24,
        restartKeybind: 'tab-enter',

        ...freshTest([], 30, false),
        spellLadderStarted: false,
        spellLadderResetRequest: 0,

        results: [],
        spellLadderResults: [],

        showSettings: false,
        showCommandPalette: false,
        showStatsPanel: false,
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

        endTest: () => {
          const state = get();
          const elapsedSeconds = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
          const testDurationSeconds = state.mode === 'time'
            ? Math.min(state.timeOption, Math.max(0.001, elapsedSeconds || state.timeOption))
            : Math.max(0.001, elapsedSeconds);

          const characterStats = calculateCharacterStats(state.words, state.typedChars);
          const separatorStats = calculateSeparatorStats(state.words, state.typedChars, state.currentWordIndex);
          const performanceStats = calculatePerformanceStats(characterStats, testDurationSeconds, 0, {
            additionalCorrectChars: separatorStats.correctSeparators,
            additionalTypedChars: separatorStats.typedSeparators,
          });
          const validation = validateTestAttempt(state.words, state.typedChars, characterStats, separatorStats, {
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
            timestamp: Date.now()
          };

          const shouldRecordResult = !state.suppressResultRecording && validation.isValid;

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
            if (currentWordChars.length > 0) {
              currentWordChars.pop();
              set({ typedChars: newTypedChars });
            } else if (state.currentWordIndex > 0) {
              // Go back to previous word
              set({ currentWordIndex: state.currentWordIndex - 1, typedChars: newTypedChars });
            }
          } else if (key === ' ') {
            // Move to next word if current word has characters
            if (currentWordChars.length > 0) {
              const nextWordIndex = state.currentWordIndex + 1;

              if (state.mode === 'words' && nextWordIndex >= state.wordOption) {
                get().endTest();
                return;
              }

              newTypedChars[nextWordIndex] ??= [];
              set({ currentWordIndex: nextWordIndex, typedChars: newTypedChars });
            }
          } else if (key.length === 1) {
            const charIndex = currentWordChars.length;
            const isExtra = charIndex >= currentWord.length;

            currentWordChars.push({
              char: key,
              correct: !isExtra && key === currentWord[charIndex],
              extra: isExtra
            });

            set({ typedChars: newTypedChars });

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

        toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
        setShowSettings: (showSettings) => set({ showSettings }),
        toggleCommandPalette: () => set((state) => ({ showCommandPalette: !state.showCommandPalette })),
        toggleStatsPanel: () => set((state) => ({ showStatsPanel: !state.showStatsPanel })),
        setShowStatsPanel: (showStatsPanel) => set({ showStatsPanel }),
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
        const incoming = (persistedState ?? {}) as Partial<Omit<TypingState, 'gameMode'>> & { gameMode?: string };
        const merged = { ...currentState, ...incoming };

        return {
          ...merged,
          theme: incoming.theme && incoming.theme in themes ? incoming.theme : currentState.theme,
          language: incoming.language && incoming.language in languages ? incoming.language : currentState.language,
          // legacy name
          gameMode: (incoming.gameMode === 'spell-climb' ? 'spell-ladder' : merged.gameMode) as GameMode,
          // older versions stored duplicate cloud copies of the same test
          results: dedupeResults(merged.results ?? []),
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
