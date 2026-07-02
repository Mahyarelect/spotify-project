import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle size={32} className="text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-100">
            {t.error.title}
          </h1>
          <p className="text-sm text-zinc-400">
            {t.error.description}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left">
          <p className="break-words font-mono text-xs text-red-400">
            {error.message || t.error.unknown}
          </p>
        </div>

        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
        >
          <RefreshCw size={16} />
          {t.error.tryAgain}
        </button>
      </div>
    </div>
  );
}
