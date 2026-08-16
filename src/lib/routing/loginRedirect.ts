export interface LoginRedirectState {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
}

export function getLoginReturnPath(state: unknown): string | null {
  const from = (state as LoginRedirectState | null)?.from;
  if (!from?.pathname?.startsWith("/") || from.pathname.startsWith("//")) return null;

  return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
}
