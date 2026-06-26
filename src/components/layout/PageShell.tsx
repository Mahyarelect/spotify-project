import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return <section className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 ${className}`}>{children}</section>;
}
