"use client";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/** "á" -> "a": accented letters highlight their base key. */
function baseKey(char: string): string {
  return char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** On-screen QWERTY keyboard with the next key to press highlighted. */
export function Keymap({ nextKey }: { nextKey: string | null }) {
  const target = nextKey === null ? null : nextKey === " " ? " " : baseKey(nextKey);

  const keyClass = (active: boolean) =>
    `flex items-center justify-center h-10 rounded-md text-sm transition-colors ${
      active ? "bg-main text-bg" : "bg-sub-alt text-sub"
    }`;

  return (
    <div aria-hidden className="mt-10 flex flex-col items-center gap-1.5 select-none">
      {ROWS.map((row, rowIndex) => (
        // each row is shifted a little to the right, like a real keyboard
        <div key={row} className="flex gap-1.5" style={{ marginLeft: rowIndex * 20 }}>
          {[...row].map((key) => (
            <span key={key} className={`w-10 ${keyClass(target === key)}`}>
              {key}
            </span>
          ))}
        </div>
      ))}
      <span className={`w-64 mt-0.5 ${keyClass(target === " ")}`}>space</span>
    </div>
  );
}
