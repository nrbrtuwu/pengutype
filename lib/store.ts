import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRandomWords, LanguageKey } from './words';
import { ThemeKey } from './themes';

export type TestMode = 'time' | 'words';
export type TimeOption = 15 | 30 | 60 | 120;
export type WordOption = 10 | 25 | 50 | 100;
export type RestartKeybind = 'tab-enter' | 'tab';

interface TestResult {
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
  timestamp: number;
}

interface TypingState {
  // Test settings
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
  
  // UI
  showSettings: boolean;
  showCommandPalette: boolean;
  showStatsPanel: boolean;
  smoothCaret: boolean;
  caretStyle: 'line' | 'block' | 'underline';
  fontSize: number;
  restartKeybind: RestartKeybind;
  
  // Actions
  setMode: (mode: TestMode) => void;
  setTimeOption: (time: TimeOption) => void;
  setWordOption: (words: WordOption) => void;
  setLanguage: (language: LanguageKey) => void;
  setTheme: (theme: ThemeKey) => void;
  setWords: (words: string[]) => void;
  startTest: () => void;
  endTest: () => void;
  resetTest: () => void;
  handleKeyPress: (key: string) => void;
  updateTimeLeft: (time: number) => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
  toggleCommandPalette: () => void;
  toggleStatsPanel: () => void;
  setShowStatsPanel: (show: boolean) => void;
  setSmoothCaret: (smooth: boolean) => void;
  setCaretStyle: (style: 'line' | 'block' | 'underline') => void;
  setFontSize: (size: number) => void;
  setRestartKeybind: (keybind: RestartKeybind) => void;
  addResult: (result: TestResult) => void;
  clearHistory: () => void;
}

export const useTypingStore = create<TypingState>()(
  persist(
    (set, get) => ({
      // Default settings
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
      
      // UI
      showSettings: false,
      showCommandPalette: false,
      showStatsPanel: false,
      smoothCaret: true,
      caretStyle: 'line',
      fontSize: 24,
      restartKeybind: 'tab-enter',
      
      // Actions
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
        const timeElapsed = state.startTime ? (endTime - state.startTime) / 1000 : 0;
        
        // Calculate final stats
        let totalCorrect = 0;
        let totalIncorrect = 0;
        let totalExtra = 0;
        let totalMissed = 0;
        
        state.typedChars.forEach((wordChars, wordIndex) => {
          const originalWord = state.words[wordIndex] || '';
          wordChars.forEach((char, charIndex) => {
            if (char.extra) {
              totalExtra++;
            } else if (char.correct) {
              totalCorrect++;
            } else {
              totalIncorrect++;
            }
          });
          // Count missed characters (characters not typed in words that were started)
          if (wordChars.length > 0 && wordChars.length < originalWord.length) {
            totalMissed += originalWord.length - wordChars.length;
          }
        });
        
        const wpm = timeElapsed > 0 ? Math.round((totalCorrect / 5) / (timeElapsed / 60)) : 0;
        const rawWpm = timeElapsed > 0 ? Math.round(((totalCorrect + totalIncorrect + totalExtra) / 5) / (timeElapsed / 60)) : 0;
        const accuracy = (totalCorrect + totalIncorrect) > 0 
          ? Math.round((totalCorrect / (totalCorrect + totalIncorrect + totalExtra)) * 100) 
          : 0;
        
        const result: TestResult = {
          wpm,
          rawWpm,
          accuracy,
          correctChars: totalCorrect,
          incorrectChars: totalIncorrect,
          extraChars: totalExtra,
          missedChars: totalMissed,
          time: Math.round(timeElapsed),
          mode: state.mode,
          language: state.language,
          timeOption: state.mode === 'time' ? state.timeOption : undefined,
          wordOption: state.mode === 'words' ? state.wordOption : undefined,
          timestamp: Date.now()
        };
        
        set({ 
          isTestActive: false, 
          isTestComplete: true,
          endTime,
          correctChars: totalCorrect,
          incorrectChars: totalIncorrect,
          extraChars: totalExtra,
          missedChars: totalMissed,
          results: [...state.results, result]
        });
      },
      
      resetTest: () => {
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
          missedChars: 0
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
      setCaretStyle: (style) => set({ caretStyle: style }),
      setFontSize: (size) => set({ fontSize: size }),
      setRestartKeybind: (restartKeybind) => set({ restartKeybind }),
      addResult: (result) => set({ results: [...get().results, result] }),
      clearHistory: () => set({ results: [] })
    }),
    {
      name: 'pengutype-storage',
      partialize: (state) => ({
        mode: state.mode,
        timeOption: state.timeOption,
        wordOption: state.wordOption,
        language: state.language,
        theme: state.theme,
        smoothCaret: state.smoothCaret,
        caretStyle: state.caretStyle,
        fontSize: state.fontSize,
        restartKeybind: state.restartKeybind,
        results: state.results
      })
    }
  )
);
