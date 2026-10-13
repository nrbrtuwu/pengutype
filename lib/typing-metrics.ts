export type TypedCharacter = {
  char: string;
  correct: boolean;
  extra: boolean;
};

export type CharacterStats = {
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
};

export type SeparatorStats = {
  typedSeparators: number;
  correctSeparators: number;
};

export type TestValidationResult = {
  isValid: boolean;
  reason: string | null;
};

/**
 * Counts typed letters by outcome. Untyped letters only count as missed for words the user already moved past
 * (`currentWordIndex`), so a half-typed word in progress doesn't lower accuracy.
 */
export function calculateCharacterStats(
  words: string[],
  typedChars: TypedCharacter[][],
  currentWordIndex: number
): CharacterStats {
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;

  for (let index = 0; index < typedChars.length; index++) {
    const wordChars = typedChars[index] ?? [];
    const originalWord = words[index] ?? "";

    for (const typedChar of wordChars) {
      if (typedChar.extra) {
        extraChars++;
      } else if (typedChar.correct) {
        correctChars++;
      } else {
        incorrectChars++;
      }
    }

    if (index < currentWordIndex && wordChars.length > 0) {
      const nonExtraTypedCount = Math.min(wordChars.length, originalWord.length);
      if (nonExtraTypedCount < originalWord.length) {
        missedChars += originalWord.length - nonExtraTypedCount;
      }
    }
  }

  return {
    correctChars,
    incorrectChars,
    extraChars,
    missedChars,
  };
}

/** Words before `currentWordIndex` that were typed exactly right. */
export function countCorrectWords(words: string[], typedChars: TypedCharacter[][], currentWordIndex: number): number {
  let count = 0;
  for (let index = 0; index < currentWordIndex; index++) {
    const typed = typedChars[index] ?? [];
    if (typed.length === words[index]?.length && typed.every((c) => c.correct && !c.extra)) count++;
  }
  return count;
}

export function calculateSeparatorStats(
  words: string[],
  typedChars: TypedCharacter[][],
  currentWordIndex: number
): SeparatorStats {
  const typedSeparators = Math.max(0, currentWordIndex);
  let correctSeparators = 0;

  const completedWords = Math.min(currentWordIndex, words.length);

  for (let wordIndex = 0; wordIndex < completedWords; wordIndex++) {
    const targetWord = words[wordIndex] ?? "";
    const typedWord = typedChars[wordIndex] ?? [];

    if (!targetWord || typedWord.length !== targetWord.length) {
      continue;
    }

    const isPerfectWord = typedWord.every((typedChar) => !typedChar.extra && typedChar.correct);
    if (isPerfectWord) {
      correctSeparators++;
    }
  }

  return {
    typedSeparators,
    correctSeparators,
  };
}

export function calculatePerformanceStats(
  characterStats: CharacterStats,
  elapsedSeconds: number,
  emptyAccuracy = 0,
  options?: {
    additionalCorrectChars?: number;
    additionalTypedChars?: number;
  }
) {
  const seconds = Math.max(0, elapsedSeconds);
  const additionalCorrectChars = Math.max(0, options?.additionalCorrectChars ?? 0);
  const additionalTypedChars = Math.max(0, options?.additionalTypedChars ?? additionalCorrectChars);
  const totalCorrectChars = characterStats.correctChars + additionalCorrectChars;
  const totalTyped =
    characterStats.correctChars +
    characterStats.incorrectChars +
    characterStats.extraChars +
    additionalTypedChars;

  if (seconds <= 0) {
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy: emptyAccuracy,
    };
  }

  const minutes = seconds / 60;
  const wpm = Math.max(0, Math.round((totalCorrectChars / 5) / minutes));
  const rawWpm = Math.max(0, Math.round((totalTyped / 5) / minutes));
  const accuracyBase = totalTyped + characterStats.missedChars;
  const accuracy = accuracyBase > 0
    ? Math.round((totalCorrectChars / accuracyBase) * 100)
    : emptyAccuracy;

  return {
    wpm,
    rawWpm,
    accuracy,
  };
}

export function calculateConsistency(characterStats: CharacterStats) {
  const denominator =
    characterStats.correctChars +
    characterStats.incorrectChars +
    characterStats.extraChars +
    characterStats.missedChars;

  if (denominator <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((characterStats.correctChars / denominator) * 100)));
}

export function validateTestAttempt(
  words: string[],
  typedChars: TypedCharacter[][],
  characterStats: CharacterStats,
  separatorStats: SeparatorStats,
  options?: {
    elapsedSeconds?: number;
    accuracy?: number;
  }
): TestValidationResult {
  const elapsedSeconds = Math.max(0, options?.elapsedSeconds ?? 0);
  const accuracy = Math.max(0, Math.min(100, options?.accuracy ?? 100));

  if (elapsedSeconds < 1.5) {
    return {
      isValid: false,
      reason: "too short",
    };
  }

  if (accuracy < 50) {
    return {
      isValid: false,
      reason: "low accuracy",
    };
  }

  const startedWords = typedChars.filter((wordChars) => wordChars.length > 0).length;
  const typedLetters =
    characterStats.correctChars + characterStats.incorrectChars + characterStats.extraChars;
  const completionBase = characterStats.correctChars + characterStats.missedChars;
  const completionRatio = completionBase > 0 ? characterStats.correctChars / completionBase : 0;
  const separatorShare =
    typedLetters + separatorStats.typedSeparators > 0
      ? separatorStats.typedSeparators / (typedLetters + separatorStats.typedSeparators)
      : 0;
  const averageTypedPerStartedWord = startedWords > 0 ? typedLetters / startedWords : 0;

  const looksLikeSkipSpam =
    startedWords >= 8 &&
    separatorStats.typedSeparators >= startedWords - 1 &&
    separatorShare >= 0.4 &&
    completionRatio < 0.45 &&
    averageTypedPerStartedWord <= 1.8;

  if (looksLikeSkipSpam) {
    return {
      isValid: false,
      reason: "skip spam",
    };
  }

  const targetCoverage = words.slice(0, startedWords).reduce((sum, word) => sum + word.length, 0);
  const typedCoverage = Math.min(targetCoverage, typedLetters + characterStats.missedChars);

  if (startedWords >= 10 && typedCoverage > 0 && completionRatio < 0.2) {
    return {
      isValid: false,
      reason: "low completion",
    };
  }

  return {
    isValid: true,
    reason: null,
  };
}
