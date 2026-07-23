import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import * as userService from "@/lib/services/userService";
import type { UserSearchResult } from "@/types/user";
import { UserSearchResultCard } from "./UserSearchResultCard";

const DEBOUNCE_MS = 300;

export function UserSearch({ currentUserId }: { currentUserId: string }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const trimmedQuery = query.trim();

  useEffect(() => {
    const sequence = ++requestSequence.current;
    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await userService.searchUsers(trimmedQuery, 1, controller.signal);
        if (sequence === requestSequence.current) setResults(page.results);
      } catch (caught) {
        if (!controller.signal.aborted && sequence === requestSequence.current) {
          setResults([]);
          setError(caught instanceof Error ? caught.message : t.userSearch.error);
        }
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [t.userSearch.error, trimmedQuery]);

  async function toggleFollow(result: UserSearchResult) {
    setPendingId(result.id);
    setError(null);
    try {
      const updated = result.isFollowing
        ? await userService.unfollowUser(result.username)
        : await userService.followUser(result.username);
      setResults((current) => current.map((item) => (
        item.id === result.id
          ? {
              ...item,
              followersCount: updated.followersCount,
              followingCount: updated.followingCount,
              isFollowing: updated.isFollowing,
            }
          : item
      )));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.userSearch.followError);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="user-search-title" className="space-y-4">
      <div>
        <h2 id="user-search-title" className="text-xl font-bold">{t.userSearch.title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{t.userSearch.description}</p>
      </div>
      <label className="block">
        <span className="sr-only">{t.userSearch.label}</span>
        <span className="relative block">
          <Search
            size={19}
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.userSearch.placeholder}
            className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2 pe-4 ps-11 text-zinc-100 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
          />
        </span>
      </label>

      {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
        <p className="text-sm text-zinc-400">{t.userSearch.minimum}</p>
      )}
      {loading && <p role="status" className="text-sm text-zinc-400">{t.userSearch.loading}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-950/30 p-3 text-sm text-red-400">{error}</p>}
      {!loading && !error && trimmedQuery.length >= 2 && results.length === 0 && (
        <p className="text-sm text-zinc-400">{t.userSearch.empty}</p>
      )}
      {results.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {results.map((result) => (
            <UserSearchResultCard
              key={result.id}
              result={result}
              currentUserId={currentUserId}
              pending={pendingId === result.id}
              onToggleFollow={(item) => void toggleFollow(item)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
