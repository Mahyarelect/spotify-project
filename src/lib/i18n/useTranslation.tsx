import { useContext, createContext, type ReactNode } from "react";
import { en, type Translations } from "./translations/en";
import { fa } from "./translations/fa";

type Lang = "en" | "fa";

const translations: Record<Lang, Translations> = { en, fa };

interface I18nContextType {
  lang: Lang;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({ lang: "en", t: en });

export function useTranslation() {
  return useContext(I18nContext);
}

export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ lang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export type { Lang, Translations };
