import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { I18nProvider, type Lang } from "./useTranslation";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const lang: Lang = user?.preferences.language ?? "en";

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");
  }, [lang]);

  return <I18nProvider lang={lang}>{children}</I18nProvider>;
}
