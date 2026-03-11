import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRandomWords } from '@/lib/words';
import { languages } from '@/languages';
import type { LanguageKey } from '@/languages';
import { ThemeKey, themes } from './themes';
import { calculateCharacterStats, calculatePerformanceStats, calculateSeparatorStats, validateTestAttempt } from './typing-metrics';

export type TestMode = 'time' | 'words';
export type GameMode = 'normal' | 'spell-ladder';
export type SpellingRepeatMode = 'single' | 'infinite';
export type TimeOption = 15 | 30 | 60 | 120;
export type WordOption = 10 | 25 | 50 | 100;
export type RestartKeybind = 'tab-enter' | 'tab';
export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

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
  isValid: boolean;
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
  // Test settings
  gameMode: GameMode;
  spellingRepeatMode: SpellingRepeatMode;
  mode: TestMode;
  timeOption: TimeOption;
  wordOption: WordOption;
  language: LanguageKey;
  theme: ThemeKey;
  
  // Test state
  isTestActive: boolean;
  isTestComplete: boolean;
  currentWordIndex: number;
  currentCharIndex: number;
  words: string[];
  typedWords: string[];
  typedChars: { char: string; correct: boolean; extra: boolean }[][];
  startTime: number | null;
  endTime: number | null;
  timeLeft: number;
  
  // Statistics
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  
  // History
  results: TestResult[];
  spellLadderResults: SpellLadderResult[];
  currentResult: TestResult | null;
  
  // UI
  showSettings: boolean;
  showCommandPalette: boolean;
  showStatsPanel: boolean;
  smoothCaret: boolean;
  caretStyle: 'line';
  fontSize: number;
  restartKeybind: RestartKeybind;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncPendingCount: number;
  cloudLastSyncedAt: number | null;
  hasHydrated: boolean;
  suppressResultRecording: boolean;
  invalidationNotice: { id: number; reason: string } | null;
  
  // Actions
  setGameMode: (mode: GameMode) => void;
  setSpellingRepeatMode: (mode: SpellingRepeatMode) => void;
  setMode: (mode: TestMode) => void;
  setTimeOption: (time: TimeOption) => void;
  setWordOption: (words: WordOption) => void;
  setLanguage: (language: LanguageKey) => void;
  setTheme: (theme: ThemeKey) => void;
  setWords: (words: string[]) => void;
  startTest: () => void;
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
  setSmoothCaret: (smooth: boolean) => void;
  setCaretStyle: (style: 'line') => void;
  setFontSize: (size: number) => void;
  setRestartKeybind: (keybind: RestartKeybind) => void;
  setCloudSyncState: (status: CloudSyncStatus, pendingCount: number) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  mergeResults: (incomingResults: TestResult[]) => void;
  addResult: (result: TestResult) => void;
  addSpellLadderResult: (result: SpellLadderResult) => void;
  clearHistory: () => void;
  setInvalidationNotice: (reason: string) => void;
  clearInvalidationNotice: () => void;
}

function resultToKey(result: TestResult): string {
  return [
    result.timestamp,
    result.mode,
    result.language,
    result.timeOption ?? '',
    result.wordOption ?? '',
    result.isValid ? '1' : '0',
    result.invalidReason ?? '',
    result.wpm,
    result.rawWpm,
    result.accuracy,
    result.correctChars,
    result.incorrectChars,
    result.extraChars,
    result.missedChars,
    result.time,
  ].join('|');
}

export const useTypingStore = create<TypingState>()(
  persist(
    (set, get) => ({
      // Default settings
      gameMode: 'normal',
      spellingRepeatMode: 'infinite',
      mode: 'time',
      timeOption: 30,
      wordOption: 25,
      language: 'english',
      theme: 'aurora',
      
      // Test state
      isTestActive: false,
      isTestComplete: false,
      currentWordIndex: 0,
      currentCharIndex: 0,
      words: [],
      typedWords: [],
      typedChars: [],
      startTime: null,
      endTime: null,
      timeLeft: 30,
      
      // Statistics
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      
      // History
      results: [],
      spellLadderResults: [],
      currentResult: null,
      
      // UI
      showSettings: false,
      showCommandPalette: false,
      showStatsPanel: false,
      smoothCaret: true,
      caretStyle: 'line',
      fontSize: 24,
      restartKeybind: 'tab-enter',
      cloudSyncStatus: 'idle',
      cloudSyncPendingCount: 0,
      cloudLastSyncedAt: null,
      hasHydrated: false,
      suppressResultRecording: false,
      invalidationNotice: null,
      
      // Actions
      setGameMode: (gameMode) => set({ gameMode }),
      setSpellingRepeatMode: (spellingRepeatMode) => set({ spellingRepeatMode }),
      setMode: (mode) => set({ mode }),
      setTimeOption: (timeOption) => set({ timeOption, timeLeft: timeOption }),
      setWordOption: (wordOption) => set({ wordOption }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setWords: (words) => set({ 
        words, 
        typedWords: [], 
        typedChars: words.map(() => []),
        currentWordIndex: 0,
        currentCharIndex: 0
      }),
      
      startTest: () => set({ 
        isTestActive: true, 
        startTime: Date.now(),
        timeLeft: get().timeOption
      }),
      
      endTest: () => {
        const state = get();
        const endTime = Date.now();
        const elapsedSeconds = state.startTime ? (endTime - state.startTime) / 1000 : 0;
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

        const finalWpm = validation.isValid ? performanceStats.wpm : 0;
        const finalRawWpm = validation.isValid ? performanceStats.rawWpm : 0;
        const finalAccuracy = validation.isValid ? performanceStats.accuracy : 0;
        
        const result: TestResult = {
          wpm: finalWpm,
          rawWpm: finalRawWpm,
          accuracy: finalAccuracy,
          correctChars: characterStats.correctChars,
          incorrectChars: characterStats.incorrectChars,
          extraChars: characterStats.extraChars,
          missedChars: characterStats.missedChars,
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
        const nextInvalidationNotice = !validation.isValid && validation.reason
          ? { id: Date.now(), reason: validation.reason }
          : state.invalidationNotice;
        
        set({ 
          isTestActive: false, 
          isTestComplete: true,
          endTime,
          correctChars: characterStats.correctChars,
          incorrectChars: characterStats.incorrectChars,
          extraChars: characterStats.extraChars,
          missedChars: characterStats.missedChars,
          currentResult: result,
          results: shouldRecordResult ? [...state.results, result] : state.results,
          suppressResultRecording: false,
          invalidationNotice: nextInvalidationNotice
        });
      },
      
      resetTest: () => {
        const state = get();
        const count = state.mode === 'time' ? 200 : state.wordOption;
        const words = state.suppressResultRecording && state.words.length > 0
          ? state.words
          : getRandomWords(state.language, count);

        set({
          isTestActive: false,
          isTestComplete: false,
          currentWordIndex: 0,
          currentCharIndex: 0,
          words,
          typedWords: [],
          typedChars: words.map(() => []),
          startTime: null,
          endTime: null,
          timeLeft: state.timeOption,
          correctChars: 0,
          incorrectChars: 0,
          extraChars: 0,
          missedChars: 0,
          currentResult: null,
          suppressResultRecording: state.suppressResultRecording,
          invalidationNotice: null
        });
      },

      exitRetryMode: () => {
        const state = get();
        const count = state.mode === 'time' ? 200 : state.wordOption;
        const words = getRandomWords(state.language, count);

        set({
          isTestActive: false,
          isTestComplete: false,
          currentWordIndex: 0,
          currentCharIndex: 0,
          words,
          typedWords: [],
          typedChars: words.map(() => []),
          startTime: null,
          endTime: null,
          timeLeft: state.timeOption,
          correctChars: 0,
          incorrectChars: 0,
          extraChars: 0,
          missedChars: 0,
          currentResult: null,
          suppressResultRecording: false,
          invalidationNotice: null
        });
      },

      retryCurrentTest: () => {
        const state = get();
        const words = state.words.length > 0
          ? state.words
          : getRandomWords(state.language, state.mode === 'time' ? 200 : state.wordOption);

        set({
          isTestActive: false,
          isTestComplete: false,
          currentWordIndex: 0,
          currentCharIndex: 0,
          words,
          typedWords: [],
          typedChars: words.map(() => []),
          startTime: null,
          endTime: null,
          timeLeft: state.timeOption,
          correctChars: 0,
          incorrectChars: 0,
          extraChars: 0,
          missedChars: 0,
          currentResult: null,
          suppressResultRecording: true,
          invalidationNotice: null
        });
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
            set({ 
              typedChars: newTypedChars,
              currentCharIndex: Math.max(0, state.currentCharIndex - 1)
            });
          } else if (state.currentWordIndex > 0) {
            // Go back to previous word
            const prevWordIndex = state.currentWordIndex - 1;
            const prevWordChars = newTypedChars[prevWordIndex] || [];
            set({
              currentWordIndex: prevWordIndex,
              currentCharIndex: prevWordChars.length,
              typedChars: newTypedChars
            });
          }
        } else if (key === ' ') {
          // Move to next word if current word has characters
          if (currentWordChars.length > 0) {
            const nextWordIndex = state.currentWordIndex + 1;
            
            // Check if test is complete (words mode)
            if (state.mode === 'words' && nextWordIndex >= state.wordOption) {
              get().endTest();
              return;
            }
            
            if (!newTypedChars[nextWordIndex]) {
              newTypedChars[nextWordIndex] = [];
            }
            
            set({
              currentWordIndex: nextWordIndex,
              currentCharIndex: 0,
              typedChars: newTypedChars
            });
          }
        } else if (key.length === 1) {
          const charIndex = currentWordChars.length;
          const expectedChar = currentWord[charIndex];
          const isExtra = charIndex >= currentWord.length;
          const isCorrect = !isExtra && key === expectedChar;
          
          currentWordChars.push({
            char: key,
            correct: isCorrect,
            extra: isExtra
          });

          const isLastWordInWordsMode =
            state.mode === 'words' && state.currentWordIndex >= state.wordOption - 1;
          const isCurrentWordComplete = currentWordChars.length >= currentWord.length;

          if (isLastWordInWordsMode && isCurrentWordComplete) {
            set({
              typedChars: newTypedChars,
              currentCharIndex: charIndex + 1
            });
            get().endTest();
            return;
          }
          
          set({
            typedChars: newTypedChars,
            currentCharIndex: charIndex + 1
          });
        }
      },
      
      updateTimeLeft: (time) => {
        set({ timeLeft: time });
        if (time <= 0 && get().isTestActive) {
          get().endTest();
        }
      },
      
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      setShowSettings: (show) => set({ showSettings: show }),
      toggleCommandPalette: () => set({ showCommandPalette: !get().showCommandPalette }),
      toggleStatsPanel: () => set({ showStatsPanel: !get().showStatsPanel }),
      setShowStatsPanel: (show) => set({ showStatsPanel: show }),
      setSmoothCaret: (smooth) => set({ smoothCaret: smooth }),
      setCaretStyle: () => set({ caretStyle: 'line' }),
      setFontSize: (size) => set({ fontSize: size }),
      setRestartKeybind: (restartKeybind) => set({ restartKeybind }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setCloudSyncState: (status, pendingCount) =>
        set((state) => {
          const isSyncedState = status === 'synced' && pendingCount === 0;
          const nextCloudLastSyncedAt = isSyncedState
            ? Date.now()
            : status === 'idle'
              ? null
              : state.cloudLastSyncedAt;

          if (
            state.cloudSyncStatus === status &&
            state.cloudSyncPendingCount === pendingCount &&
            state.cloudLastSyncedAt === nextCloudLastSyncedAt
          ) {
            return state;
          }

          return {
            cloudSyncStatus: status,
            cloudSyncPendingCount: pendingCount,
            cloudLastSyncedAt: nextCloudLastSyncedAt,
          };
        }),
      mergeResults: (incomingResults) =>
        set((state) => {
          if (incomingResults.length === 0) {
            return state;
          }

          const map = new Map<string, TestResult>();

          for (const result of state.results) {
            map.set(resultToKey(result), result);
          }

          for (const result of incomingResults) {
            map.set(resultToKey(result), result);
          }

          const merged = [...map.values()].sort((a, b) => a.timestamp - b.timestamp);

          return { results: merged };
        }),
      addResult: (result) => set({ results: [...get().results, result] }),
      addSpellLadderResult: (result) => set({ spellLadderResults: [...get().spellLadderResults, result] }),
      clearHistory: () => set({ results: [], spellLadderResults: [] }),
      setInvalidationNotice: (reason) => set({ invalidationNotice: { id: Date.now(), reason } }),
      clearInvalidationNotice: () => set({ invalidationNotice: null })
    }),
    {
      name: 'pengutype-storage',
      merge: (persistedState, currentState) => {
        const incomingState = (persistedState as Partial<TypingState>) ?? {};
        const mergedState = { ...currentState, ...incomingState };

        const incomingTheme = incomingState.theme;
        const incomingLanguage = incomingState.language;
        const incomingGameMode = (incomingState as { gameMode?: string }).gameMode;

        const safeTheme =
          typeof incomingTheme === 'string' && incomingTheme in themes
            ? (incomingTheme as ThemeKey)
            : currentState.theme;

        const safeLanguage =
          typeof incomingLanguage === 'string' && incomingLanguage in languages
            ? (incomingLanguage as LanguageKey)
            : currentState.language;

        return {
          ...mergedState,
          theme: safeTheme,
          language: safeLanguage,
          caretStyle: 'line',
          gameMode: incomingGameMode === 'spell-climb' ? 'spell-ladder' : mergedState.gameMode,
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
        caretStyle: state.caretStyle,
        fontSize: state.fontSize,
        restartKeybind: state.restartKeybind,
        results: state.results,
        spellLadderResults: state.spellLadderResults
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          const themeKey = state?.theme;
          if (themeKey && !(themeKey in themes)) {
            state?.setTheme('aurora');
          }
          const languageKey = state?.language;
          if (languageKey && !(languageKey in languages)) {
            state?.setLanguage('english');
          }
          if (state?.caretStyle !== 'line') {
            state?.setCaretStyle('line');
          }
          if ((state as { gameMode?: string } | undefined)?.gameMode === 'spell-climb') {
            state?.setGameMode('spell-ladder');
          }
          state?.setHasHydrated(true);
        }
      }
    }
  )
);
