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

export function calculateCharacterStats(words: string[], typedChars: TypedCharacter[][]): CharacterStats {
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

    if (wordChars.length > 0) {
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
  const accuracy = totalTyped > 0
    ? Math.round((totalCorrectChars / totalTyped) * 100)
    : emptyAccuracy;

  return {
    wpm,
    rawWpm,
    accuracy,
  };
}
