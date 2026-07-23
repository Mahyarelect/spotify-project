import { useContext, createContext, type ReactNode } from "react";
import { en, type Translations } from "./translations/en";
import { fa } from "./translations/fa";

export type Lang = "en" | "fa";

const translations: Record<Lang, Translations> = { en, fa };

interface I18nContextType {
  lang: Lang;
  language: Lang;
  direction: "ltr" | "rtl";
  setLanguage: (language: Lang) => Promise<void>;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  language: "en",
  direction: "ltr",
  setLanguage: async () => undefined,
  t: en,
});

export function useTranslation() {
  return useContext(I18nContext);
}

export function I18nProvider({
  language,
  setLanguage,
  children,
}: {
  language: Lang;
  setLanguage: (language: Lang) => Promise<void>;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider
      value={{
        lang: language,
        language,
        direction: language === "fa" ? "rtl" : "ltr",
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export type { Translations };
