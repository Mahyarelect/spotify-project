import type { ReactNode } from "react";

export function HorizontalCardScroller({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
      {children}
    </div>
  );
}
