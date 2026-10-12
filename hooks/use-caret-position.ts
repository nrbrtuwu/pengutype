import { RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";

interface UseCaretPositionParams {
  wordsRef: RefObject<HTMLDivElement | null>;
  fontSize: number;
  typedChars: { char: string; correct: boolean; extra?: boolean }[][];
  currentWordIndex: number;
  words: string[];
}

export function useCaretPosition({
  wordsRef,
  fontSize,
  typedChars,
  currentWordIndex,
  words,
}: UseCaretPositionParams) {
  const [caretPosition, setCaretPosition] = useState({ x: 0, y: 0 });
  const [isCaretReady, setIsCaretReady] = useState(false);

  const caretHeight = Math.max(10, Math.round(fontSize * 1.2));

  const updateCaretPosition = useCallback(() => {
    if (!wordsRef.current) {
      setIsCaretReady(false);
      return;
    }

    const container = wordsRef.current;
    const anchor = container.querySelector("[data-caret-anchor]") as HTMLElement | null;
    if (!anchor) {
      setIsCaretReady(false);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    const left = anchorRect.left - containerRect.left + container.scrollLeft;
    const top =
      anchorRect.top -
      containerRect.top +
      container.scrollTop +
      Math.max(0, (anchorRect.height - caretHeight) / 2);

    setCaretPosition((prev) => {
      if (Math.abs(prev.x - left) < 0.5 && Math.abs(prev.y - top) < 0.5) {
        return prev;
      }
      return { x: left, y: top };
    });

    setIsCaretReady(true);
  }, [caretHeight, wordsRef]);

  useLayoutEffect(() => {
    requestAnimationFrame(updateCaretPosition);
  }, [updateCaretPosition, typedChars, currentWordIndex, words, fontSize]);

  useEffect(() => {
    if (!wordsRef.current) return;

    const container = wordsRef.current;
    const handleReposition = () => requestAnimationFrame(updateCaretPosition);

    container.addEventListener("scroll", handleReposition, { passive: true });
    window.addEventListener("resize", handleReposition);

    return () => {
      container.removeEventListener("scroll", handleReposition);
      window.removeEventListener("resize", handleReposition);
    };
  }, [updateCaretPosition, wordsRef]);

  return {
    caretPosition,
    isCaretReady,
  };
}
