/**
 * Gameplay modifiers, shown as "fun" modes in settings (inspired by osu! mods).
 * Runs with any of them active are unranked (not saved to history or personal bests).
 */
export type ModKey = "flashlight" | "hidden" | "sudden-death" | "sleepy" | "drunk" | "mirror" | "earthquake";

export interface Mod {
  acronym: string;
  name: string;
  description: string;
}

// Insertion order is the display order
export const MODS: Record<ModKey, Mod> = {
  flashlight: {
    acronym: "FL",
    name: "flashlight",
    description: "Only the area around the caret is lit, and the light shrinks with every correct word.",
  },
  hidden: {
    acronym: "HD",
    name: "hidden",
    description: "Only the current and the next word are visible.",
  },
  "sudden-death": {
    acronym: "SD",
    name: "sudden death",
    description: "One wrong letter and the test fails.",
  },
  sleepy: {
    acronym: "ZZ",
    name: "sleepy",
    description: "Your eyelids get heavy and the words blur. Keep typing to stay awake.",
  },
  drunk: {
    acronym: "DR",
    name: "drunk",
    description: "The words sway and tilt around.",
  },
  mirror: {
    acronym: "MR",
    name: "mirror",
    description: "Everything you type is mirrored left to right.",
  },
  earthquake: {
    acronym: "EQ",
    name: "earthquake",
    description: "Every mistake shakes the screen.",
  },
};

export const MOD_KEYS = Object.keys(MODS) as ModKey[];

export function formatMods(mods: ModKey[]): string {
  return MOD_KEYS.filter((key) => mods.includes(key))
    .map((key) => MODS[key].acronym)
    .join(" ");
}

