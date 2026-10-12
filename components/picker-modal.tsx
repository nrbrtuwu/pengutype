"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Theme } from "@/lib/themes";

type PickerOption = { key: string; label: string };

/** Searchable, keyboard-navigable list modal. Mount it only while open so its state resets each time. */
export function PickerModal({
  options,
  placeholder,
  emptyText,
  onSelect,
  onClose,
  theme,
}: {
  options: PickerOption[];
  placeholder: string;
  emptyText: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = options.filter(
    (option) => option.label.toLowerCase().includes(normalizedQuery) || option.key.toLowerCase().includes(normalizedQuery)
  );

  const select = (option: PickerOption | undefined) => {
    if (!option) return;
    onSelect(option.key);
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (filtered.length > 0 && e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((prev) => (prev + 1) % filtered.length);
      } else if (filtered.length > 0 && e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        select(filtered[highlighted]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    optionRefs.current[highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: `${theme.background}cc` }} onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="fixed top-[18%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.background,
          border: `1px solid ${theme.secondary}`,
          boxShadow: `0 20px 60px ${theme.background}cc`,
        }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: theme.secondary }}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            placeholder={placeholder}
            autoFocus
            className="w-full bg-transparent outline-none"
            style={{ color: theme.foreground }}
          />
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length > 0 ? (
            filtered.map((option, index) => (
              <button
                key={option.key}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className="w-full text-left px-4 py-2 transition-colors"
                style={{
                  color: theme.foreground,
                  backgroundColor: index === highlighted ? theme.secondary : "transparent",
                }}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => select(option)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-sm" style={{ color: theme.sub }}>
              {emptyText}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
