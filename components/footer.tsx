"use client";

import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";
import { motion } from "framer-motion";
import { Github, Heart, Coffee } from "lucide-react";

export function Footer() {
  const { theme, restartKeybind } = useTypingStore();
  const currentTheme = themes[theme];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-20 px-6 py-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Keyboard shortcuts */}
        <div 
          className="flex items-center gap-4 text-xs font-medium"
          style={{ color: currentTheme.sub }}
        >
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl glass">
            <kbd 
              className="px-2 py-1 rounded-lg font-mono font-bold"
              style={{ backgroundColor: currentTheme.secondary, color: currentTheme.foreground }}
            >
              tab
            </kbd>
            {restartKeybind === "tab-enter" && (
              <>
                <span>+</span>
                <kbd
                  className="px-2 py-1 rounded-lg font-mono font-bold"
                  style={{ backgroundColor: currentTheme.secondary, color: currentTheme.foreground }}
                >
                  enter
                </kbd>
              </>
            )}
            <span className="ml-1">restart</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl glass">
            <kbd 
              className="px-2 py-1 rounded-lg font-mono font-bold"
              style={{ backgroundColor: currentTheme.secondary, color: currentTheme.foreground }}
            >
              esc
            </kbd>
            <span className="ml-1">settings</span>
          </div>
        </div>

        {/* Credits */}
        <div 
          className="flex items-center gap-3 text-xs font-medium"
          style={{ color: currentTheme.sub }}
        >
          <motion.span 
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl glass"
            whileHover={{ scale: 1.02 }}
          >
            Made with 
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart size={14} style={{ color: currentTheme.primary }} fill={currentTheme.primary} />
            </motion.span>
            <span>&</span>
            <Coffee size={14} style={{ color: currentTheme.primary }} />
          </motion.span>
          
          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl glass transition-all"
            style={{ color: currentTheme.sub }}
            whileHover={{ scale: 1.1, color: currentTheme.foreground }}
            whileTap={{ scale: 0.95 }}
          >
            <Github size={18} />
          </motion.a>
        </div>
      </div>
    </motion.footer>
  );
}
