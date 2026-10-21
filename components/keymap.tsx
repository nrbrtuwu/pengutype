"use client";

import { useEffect, useState } from "react";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/** "á" -> "a": accented letters light up their base key. */
function baseKey(char: string): string {
  return char === " " ? " " : char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Keys currently held down on the physical keyboard. */
function usePressedKeys(): Set<string> {
  const [pressed, setPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const update = (key: string, down: boolean) =>
      setPressed((previous) => {
        if (previous.has(key) === down) return previous;
        const next = new Set(previous);
        if (down) next.add(key);
        else next.delete(key);
        return next;
      });
    const onKeyDown = (e: KeyboardEvent) => e.key.length === 1 && update(baseKey(e.key), true);
    const onKeyUp = (e: KeyboardEvent) => e.key.length === 1 && update(baseKey(e.key), false);
    // keyup never arrives if the window loses focus while a key is held
    const onBlur = () => setPressed(new Set());

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return pressed;
}

/** On-screen QWERTY keyboard whose keys light up while they're held down. */
export function Keymap() {
  const pressed = usePressedKeys();

  const keyClass = (key: string) =>
    `flex items-center justify-center h-10 rounded-md text-sm ${pressed.has(key) ? "bg-main text-bg" : "bg-sub-alt text-sub"}`;

  return (
    <div aria-hidden className="mt-10 flex flex-col items-center gap-1.5 select-none">
      {ROWS.map((row, rowIndex) => (
        // each row is shifted a little to the right, like a real keyboard
        <div key={row} className="flex gap-1.5" style={{ marginLeft: rowIndex * 20 }}>
          {[...row].map((key) => (
            <span key={key} className={`w-10 ${keyClass(key)}`}>
              {key}
            </span>
          ))}
        </div>
      ))}
      <span className={`w-64 mt-0.5 ${keyClass(" ")}`}>space</span>
    </div>
  );
}
