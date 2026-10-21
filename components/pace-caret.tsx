"use client";

import { useEffect, useRef, type RefObject } from "react";
import { layoutOffsetWithin } from "@/hooks/use-caret-position";

/** Where a typist going `wpm` would be: word index plus a fractional letter index within it. */
function paceTarget(words: string[], wpm: number, elapsedSeconds: number) {
  let chars = ((wpm * 5) / 60) * elapsedSeconds; // a "word" is 5 characters, spaces included
  for (let index = 0; index < words.length; index++) {
    const length = words[index].length;
    if (chars <= length) return { index, letter: chars };
    chars -= length + 1;
    if (chars < 0) return { index, letter: length }; // in the space after the word
  }
  return null;
}

/**
 * A faint ghost caret that moves through the words at a target speed (`wpm`), starting when the test starts.
 * Positioned from layout offsets inside `wordsRef`, like the real caret.
 */
export function PaceCaret({
  wordsRef,
  words,
  startTime,
  wpm,
  fontSize,
}: {
  wordsRef: RefObject<HTMLDivElement | null>;
  words: string[];
  startTime: number | null;
  wpm: number;
  fontSize: number;
}) {
  const caretRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const caret = caretRef.current;
    const container = wordsRef.current;
    if (!caret || !container) return;

    let animationId = 0;
    const render = () => {
      animationId = requestAnimationFrame(render);
      const target = startTime ? paceTarget(words, wpm, (Date.now() - startTime) / 1000) : null;
      const wordEl = target && container.querySelectorAll<HTMLElement>("[data-word]")[target.index];
      const letters = wordEl ? [...wordEl.querySelectorAll<HTMLElement>("[data-char]")] : [];
      if (!target || !wordEl || letters.length === 0) {
        caret.style.opacity = "0";
        return;
      }

      // x of the gap before letter i (i === length means after the last letter)
      const gapX = (i: number) => {
        const letter = letters[Math.min(i, letters.length - 1)];
        const offset = layoutOffsetWithin(letter, container);
        if (!offset) return 0;
        return i < letters.length ? offset.x : offset.x + letter.offsetWidth;
      };
      const whole = Math.floor(target.letter);
      const x = gapX(whole) + (gapX(whole + 1) - gapX(whole)) * (target.letter - whole);
      const y = (layoutOffsetWithin(wordEl, container)?.y ?? 0) + Math.max(0, (wordEl.offsetHeight - fontSize * 1.2) / 2);

      caret.style.opacity = "0.5";
      caret.style.transform = `translate(${x}px, ${y}px)`;
    };
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [wordsRef, words, startTime, wpm, fontSize]);

  return (
    <div
      ref={caretRef}
      aria-hidden
      className="absolute left-0 top-0 z-10 w-0.5 rounded-sm bg-sub pointer-events-none"
      // hidden until the first frame places it
      style={{ height: Math.max(10, Math.round(fontSize * 1.2)), opacity: 0 }}
    />
  );
}
