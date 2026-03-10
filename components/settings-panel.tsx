"use client";

import { useEffect } from "react";
import { useTypingStore } from "@/lib/store";
import { themes, ThemeKey } from "@/lib/themes";
import { languages, LanguageKey, getLanguageDisplayName } from "@/lib/words";
import { motion } from "framer-motion";
import { X, Check, Palette, Globe, Type, Keyboard, Sparkles } from "lucide-react";

export function SettingsPanel() {
  const {
    showSettings,
    setShowSettings,
    theme,
    setTheme,
    language,
    setLanguage,
    smoothCaret,
    setSmoothCaret,
    caretStyle,
    setCaretStyle,
    fontSize,
    setFontSize,
    restartKeybind,
    setRestartKeybind
  } = useTypingStore();

  const currentTheme = themes[theme];

  const fontSizes = [16, 20, 24, 28, 32];
  const caretStyles: ("line" | "block" | "underline")[] = ["line", "block", "underline"];
  const restartKeybindOptions: { key: "tab-enter" | "tab"; label: string }[] = [
    { key: "tab-enter", label: "tab + enter" },
    { key: "tab", label: "tab" }
  ];

  useEffect(() => {
    if (!showSettings) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSettings, setShowSettings]);

  if (!showSettings) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: `${currentTheme.background}99` }}
        onClick={() => setShowSettings(false)}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-4 top-4 bottom-4 w-full max-w-md z-50 overflow-y-auto rounded-3xl glass-strong"
      >
        <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${currentTheme.primary}33, ${currentTheme.primary}11)`,
                      border: `1px solid ${currentTheme.primary}44`
                    }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Sparkles size={20} style={{ color: currentTheme.primary }} />
                  </motion.div>
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: currentTheme.foreground }}
                  >
                    settings
                  </h2>
                </div>
                <motion.button
                  onClick={() => setShowSettings(false)}
                  className="p-3 rounded-xl glass transition-colors"
                  style={{ color: currentTheme.sub }}
                  whileHover={{ scale: 1.05, color: currentTheme.foreground }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Theme section */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={18} style={{ color: currentTheme.primary }} />
                  <h3 
                    className="text-sm tracking-wider font-bold"
                    style={{ color: currentTheme.foreground }}
                  >
                    theme
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(themes).map(([key, t]) => (
                    <motion.button
                      key={key}
                      onClick={() => setTheme(key as ThemeKey)}
                      className="relative flex items-center gap-3 p-3 rounded-xl transition-all text-left overflow-hidden"
                      style={{
                        backgroundColor: theme === key ? `${currentTheme.primary}22` : 'transparent',
                        borderWidth: 1,
                        borderColor: theme === key ? `${currentTheme.primary}66` : `${currentTheme.sub}22`
                      }}
                      whileHover={{ scale: 1.02, backgroundColor: `${currentTheme.sub}22` }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {theme === key && (
                        <motion.div
                          layoutId="theme-glow"
                          className="absolute inset-0 rounded-xl"
                          style={{ 
                            boxShadow: `inset 0 0 20px ${currentTheme.primary}33`
                          }}
                        />
                      )}
                      <div 
                        className="w-6 h-6 rounded-lg relative z-10"
                        style={{ 
                          background: `linear-gradient(135deg, ${t.primary}, ${t.caret})`,
                          boxShadow: `0 0 10px ${t.primary}44`
                        }}
                      />
                      <span 
                        className="text-sm font-medium truncate relative z-10"
                        style={{ color: theme === key ? currentTheme.primary : currentTheme.foreground }}
                      >
                        {t.name}
                      </span>
                      {theme === key && (
                        <Check size={14} style={{ color: currentTheme.primary }} className="ml-auto relative z-10" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Language section */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={18} style={{ color: currentTheme.primary }} />
                  <h3 
                    className="text-sm tracking-wider font-bold"
                    style={{ color: currentTheme.foreground }}
                  >
                    language
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 hide-scrollbar">
                  {Object.entries(languages).map(([key, lang]) => (
                    <motion.button
                      key={key}
                      onClick={() => setLanguage(key as LanguageKey)}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                      style={{
                        backgroundColor: language === key ? `${currentTheme.primary}22` : 'transparent',
                        borderWidth: 1,
                        borderColor: language === key ? `${currentTheme.primary}66` : `${currentTheme.sub}22`
                      }}
                      whileHover={{ scale: 1.02, backgroundColor: `${currentTheme.sub}22` }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span 
                        className="text-sm font-medium truncate"
                        style={{ color: language === key ? currentTheme.primary : currentTheme.foreground }}
                      >
                        {getLanguageDisplayName(key)}
                      </span>
                      {language === key && (
                        <Check size={14} style={{ color: currentTheme.primary }} className="ml-auto" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Font size section */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Type size={18} style={{ color: currentTheme.primary }} />
                  <h3 
                    className="text-sm tracking-wider font-bold"
                    style={{ color: currentTheme.foreground }}
                  >
                    font size
                  </h3>
                </div>
                <div className="flex gap-2">
                  {fontSizes.map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className="relative flex-1 py-3 rounded-xl font-mono text-sm font-bold transition-all overflow-hidden"
                      style={{
                        color: fontSize === size ? currentTheme.background : currentTheme.foreground
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {fontSize === size && (
                        <motion.div
                          layoutId="fontsize-active"
                          className="absolute inset-0 rounded-xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`,
                            boxShadow: `0 0 20px ${currentTheme.primary}44`
                          }}
                        />
                      )}
                      {fontSize !== size && (
                        <div 
                          className="absolute inset-0 rounded-xl"
                          style={{ backgroundColor: `${currentTheme.sub}22` }}
                        />
                      )}
                      <span className="relative z-10">{size}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Restart keybind section */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Keyboard size={18} style={{ color: currentTheme.primary }} />
                  <h3
                    className="text-sm tracking-wider font-bold"
                    style={{ color: currentTheme.foreground }}
                  >
                    restart shortcut
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {restartKeybindOptions.map((option) => (
                    <motion.button
                      key={option.key}
                      onClick={() => setRestartKeybind(option.key)}
                      className="relative py-3 rounded-xl text-sm font-medium transition-all overflow-hidden"
                      style={{
                        color: restartKeybind === option.key ? currentTheme.background : currentTheme.foreground
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {restartKeybind === option.key && (
                        <motion.div
                          layoutId="restart-keybind-active"
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`,
                            boxShadow: `0 0 20px ${currentTheme.primary}44`
                          }}
                        />
                      )}
                      {restartKeybind !== option.key && (
                        <div
                          className="absolute inset-0 rounded-xl"
                          style={{ backgroundColor: `${currentTheme.sub}22` }}
                        />
                      )}
                      <span className="relative z-10">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Caret section */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Keyboard size={18} style={{ color: currentTheme.primary }} />
                  <h3 
                    className="text-sm tracking-wider font-bold"
                    style={{ color: currentTheme.foreground }}
                  >
                    caret
                  </h3>
                </div>

                {/* Caret style */}
                <div className="mb-4">
                  <label 
                    className="text-xs tracking-wider mb-2 block font-medium"
                    style={{ color: currentTheme.sub }}
                  >
                    style
                  </label>
                  <div className="flex gap-2">
                    {caretStyles.map((style) => (
                      <motion.button
                        key={style}
                        onClick={() => setCaretStyle(style)}
                        className="relative flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all overflow-hidden"
                        style={{
                          color: caretStyle === style ? currentTheme.background : currentTheme.foreground
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {caretStyle === style && (
                          <motion.div
                            layoutId="caret-active"
                            className="absolute inset-0 rounded-xl"
                            style={{ 
                              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`,
                              boxShadow: `0 0 20px ${currentTheme.primary}44`
                            }}
                          />
                        )}
                        {caretStyle !== style && (
                          <div 
                            className="absolute inset-0 rounded-xl"
                            style={{ backgroundColor: `${currentTheme.sub}22` }}
                          />
                        )}
                        <span className="relative z-10">{style}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Smooth caret toggle */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: `${currentTheme.sub}11` }}
                >
                  <label 
                    className="text-sm font-medium"
                    style={{ color: currentTheme.foreground }}
                  >
                    smooth caret animation
                  </label>
                  <motion.button
                    onClick={() => setSmoothCaret(!smoothCaret)}
                    className="relative w-14 h-7 rounded-full transition-all"
                    style={{
                      background: smoothCaret 
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.caret})`
                        : `${currentTheme.sub}33`,
                      boxShadow: smoothCaret ? `0 0 15px ${currentTheme.primary}44` : 'none'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute top-1 w-5 h-5 rounded-full shadow-lg"
                      style={{ backgroundColor: '#fff' }}
                      animate={{ left: smoothCaret ? 30 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </section>
            </div>
          </motion.div>
        </>
  );
}
