import { useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useUIStore } from "@/stores/uiStore";
import { useSceneStore } from "@/stores/sceneStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [k, setK] = useState(50);
  const [minScore, setMinScore] = useState(0.35);
  const collection = useUIStore((s) => s.activeCollection);
  const clearSearch = useSceneStore((s) => s.clearSearch);
  const { mutate: search, isPending } = useSearch(collection);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !collection) return;
    search({ query: query.trim(), k, min_score: minScore });
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", maxWidth: 520 }}
    >
      <div style={{ position: "relative", flex: 1 }}>
        {/* Search icon */}
        <div style={{
          position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "rgba(255,255,255,0.22)",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={collection ? "Semantic search…" : "Select a collection first"}
          disabled={!collection || isPending}
          style={{
            width: "100%",
            height: 32,
            paddingLeft: 32,
            paddingRight: query ? 30 : 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: '"Outfit", sans-serif',
            color: "rgba(255,255,255,0.85)",
            outline: "none",
            transition: "border-color 0.15s, background 0.15s",
            opacity: !collection || isPending ? 0.45 : 1,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.25)",
              cursor: "pointer",
              fontSize: 12,
              lineHeight: 1,
              padding: 2,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >✕</button>
        )}
      </div>

      {/* Min score threshold */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          ≥{Math.round(minScore * 100)}%
        </span>
        <input
          type="range"
          min={0} max={0.9} step={0.05}
          value={minScore}
          onChange={e => setMinScore(Number(e.target.value))}
          title={`Min similarity: ${Math.round(minScore * 100)}%`}
          style={{ width: 64, accentColor: "#3b82f6", cursor: "pointer" }}
        />
      </div>

      {/* K selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em" }}>K</span>
        <select
          value={k}
          onChange={e => setK(Number(e.target.value))}
          style={{
            height: 28,
            padding: "0 6px",
            background: "#0d1626",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: '"JetBrains Mono", monospace',
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            outline: "none",
            colorScheme: "dark",
          } as React.CSSProperties}
        >
          {[10, 20, 50, 100, 200, 500].map(v => (
            <option key={v} value={v} style={{ background: "#0d1626", color: "rgba(255,255,255,0.85)" }}>{v}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!query.trim() || !collection || isPending}
        style={{
          height: 32,
          padding: "0 14px",
          background: "rgba(59,130,246,0.80)",
          border: "none",
          borderRadius: 8,
          fontSize: 12,
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 500,
          color: "white",
          cursor: !query.trim() || !collection || isPending ? "not-allowed" : "pointer",
          opacity: !query.trim() || !collection || isPending ? 0.38 : 1,
          transition: "opacity 0.15s, background 0.15s",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "rgba(59,130,246,1)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.80)"; }}
      >
        {isPending ? "…" : "Search"}
      </button>
    </form>
  );
}
