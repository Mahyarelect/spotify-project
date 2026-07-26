import type { Translations } from "@/lib/i18n/translations/en";

type ValidationMessages = Translations["validation"];

export function localizeAuthFieldError(
  apiField: string,
  rawMessage: string,
  language: "en" | "fa",
  messages: ValidationMessages,
): string {
  const normalized = rawMessage.toLowerCase();

  if (apiField === "password_confirm" && normalized.includes("match")) {
    return messages.passwordMismatch;
  }

  if (apiField === "password") {
    if (normalized.includes("too short") || normalized.includes("at least 8")) {
      return messages.passwordMin;
    }
    if (normalized.includes("too common")) {
      return messages.passwordTooCommon;
    }
    if (normalized.includes("entirely numeric") || normalized.includes("only numbers")) {
      return messages.passwordNumericOnly;
    }
    if (normalized.includes("too similar")) {
      return messages.passwordTooSimilar;
    }
    return language === "fa" ? messages.passwordInvalid : rawMessage;
  }

  return language === "fa" ? messages.invalidField : rawMessage;
}
