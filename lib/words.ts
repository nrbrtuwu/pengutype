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
