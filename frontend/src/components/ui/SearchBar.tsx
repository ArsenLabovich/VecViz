import { useState, useRef } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useUIStore } from "@/stores/uiStore";
import { useSceneStore } from "@/stores/sceneStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const collection = useUIStore((s) => s.activeCollection);
  const clearSearch = useSceneStore((s) => s.clearSearch);
  const { mutate: search, isPending } = useSearch(collection);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !collection) return;
    search({ query: query.trim() });
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={collection ? "Search chunks…" : "Select a collection first"}
          disabled={!collection || isPending}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-40 transition"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={!query.trim() || !collection || isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 transition"
      >
        {isPending ? "…" : "Search"}
      </button>
    </form>
  );
}
