import en from "./en.json";
import de from "./de.json";
import fr from "./fr.json";
import zh from "./zh.json";
import type { Translations } from "./types";

export const translations: Record<string, Translations> = {
  en,
  de,
  fr,
  zh,
};

export type { Translations } from "./types";

export const languages = ["en", "de", "fr", "zh"] as const;
export type Language = (typeof languages)[number];

export const getLanguageName = (code: string): string => {
  const names: Record<string, string> = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    zh: "中文",
  };
  return names[code] || code;
};
