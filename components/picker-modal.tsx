"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type PickerOption = { key: string; label: string };

/** Searchable, keyboard-navigable list modal. Mount it only while open so its state resets each time. */
export function PickerModal({
  options,
  placeholder,
  emptyText,
  onSelect,
  onClose,
}: {
  options: PickerOption[];
  placeholder: string;
  emptyText: string;
  onSelect: (key: string) => void;
  onClose: () => void;
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
    <Modal onClose={onClose}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
        }}
        placeholder={placeholder}
        autoFocus
        className="w-full px-4 py-3 bg-transparent outline-none text-text placeholder:text-sub"
      />

      <div className="max-h-80 overflow-y-auto pb-2">
        {filtered.length > 0 ? (
          filtered.map((option, index) => (
            <button
              key={option.key}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              className={`w-full text-left px-4 py-2 ${index === highlighted ? "bg-sub-alt text-text" : "text-sub"}`}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => select(option)}
            >
              {option.label}
            </button>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-sub">{emptyText}</div>
        )}
      </div>
    </Modal>
  );
}

/** True while any Modal is open, so typing shouldn't reach the test underneath. */
export function isModalOpen(): boolean {
  return document.querySelector("[data-modal]") !== null;
}

/** Centered popup over a dimmed backdrop. */
export function Modal({ onClose, children, className = "top-[18%] max-w-lg" }: { onClose: () => void; children: React.ReactNode; className?: string }) {
  return (
    <>
      <div data-modal className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={`fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] rounded-lg overflow-hidden bg-bg ${className}`}
      >
        {children}
      </motion.div>
    </>
  );
}
