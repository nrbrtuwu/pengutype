import { languages, type LanguageKey } from "@/languages";

export { languages, type LanguageKey };

export function getLanguageDisplayName(languageKey: LanguageKey | string): string {
  return languageKey
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRandomWords(language: LanguageKey, count: number): string[] {
  const wordList = languages[language].words;
  const result: string[] = [];

  if (wordList.length === 0 || count <= 0) {
    return result;
  }

  if (wordList.length === 1) {
    return Array.from({ length: count }, () => wordList[0]);
  }

  for (let i = 0; i < count; i++) {
    let randomIndex = Math.floor(Math.random() * wordList.length);

    if (i > 0) {
      const previousWord = result[i - 1];
      let safetyCounter = 0;

      while (wordList[randomIndex] === previousWord && safetyCounter < 10) {
        randomIndex = Math.floor(Math.random() * wordList.length);
        safetyCounter++;
      }
    }

    result.push(wordList[randomIndex]);
  }

  return result;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getSpellingChain(language: LanguageKey, minLength = 3): string[] {
  const wordList = languages[language].words;
  const normalized = Array.from(
    new Set(
      wordList
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length >= minLength)
        .filter((word) => !/\s/.test(word))
    )
  );

  if (normalized.length === 0) {
    return [];
  }

  const byLength = new Map<number, string[]>();
  for (const word of normalized) {
    const group = byLength.get(word.length) ?? [];
    group.push(word);
    byLength.set(word.length, group);
  }

  const lengths = [...byLength.keys()].sort((a, b) => a - b);
  const startLength = lengths.includes(minLength)
    ? minLength
    : lengths.find((len) => len > minLength) ?? lengths[0];

  const chain: string[] = [];
  let currentLength = startLength;

  while (byLength.has(currentLength)) {
    const candidates = byLength.get(currentLength) ?? [];
    if (candidates.length === 0) {
      break;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    chain.push(pick);
    currentLength += 1;
  }

  return chain;
}
