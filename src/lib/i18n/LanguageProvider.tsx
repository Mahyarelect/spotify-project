import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateLanguage } from "@/lib/services/settingsService";
import { I18nProvider, type Lang } from "./useTranslation";

export const LANGUAGE_STORAGE_KEY = "spotify_language";
const LEGACY_LANGUAGE_STORAGE_KEY = ["music", "app_language"].join("");

function isLanguage(value: string | null): value is Lang {
  return value === "en" || value === "fa";
}

function initialLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  const current = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const legacy = window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  const saved = current ?? legacy;
  if (current === null && isLanguage(legacy)) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, legacy);
  }
  window.localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  return window.navigator.language.toLowerCase().startsWith("fa") ? "fa" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [language, setLanguageState] = useState<Lang>(initialLanguage);
  const guestChoiceRef = useRef(false);
  const handledUserRef = useRef<string | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "fa" ? "rtl" : "ltr";
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (!user) {
      handledUserRef.current = null;
      return;
    }
    if (handledUserRef.current === user.id) return;
    handledUserRef.current = user.id;

    if (guestChoiceRef.current) {
      guestChoiceRef.current = false;
      if (user.preferences.language !== language) {
        void updateLanguage(language).then(refreshUser).catch(() => undefined);
      }
      return;
    }

    setLanguageState(user.preferences.language);
  }, [language, refreshUser, user]);

  const setLanguage = useCallback(
    async (nextLanguage: Lang) => {
      const previous = language;
      setLanguageState(nextLanguage);
      if (!user) {
        guestChoiceRef.current = true;
        return;
      }
      try {
        await updateLanguage(nextLanguage);
        await refreshUser();
      } catch (error) {
        setLanguageState(previous);
        throw error;
      }
    },
    [language, refreshUser, user],
  );

  return (
    <I18nProvider language={language} setLanguage={setLanguage}>
      {children}
    </I18nProvider>
  );
}
