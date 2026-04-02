import { useState } from "react";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/hooks/useCollections";
import { useUIStore } from "@/stores/uiStore";
import { useSceneStore } from "@/stores/sceneStore";

export function CollectionList() {
  const { data: collections = [], isLoading } = useCollections();
  const { mutate: create, isPending: creating } = useCreateCollection();
  const { mutate: del } = useDeleteCollection();
  const activeCollection = useUIStore((s) => s.activeCollection);
  const setActiveCollection = useUIStore((s) => s.setActiveCollection);
  const clearSearch = useSceneStore((s) => s.clearSearch);

  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    create({ name: newName.trim() }, {
      onSuccess: () => { setNewName(""); setShowCreate(false); }
    });
  };

  const handleSelect = (name: string) => {
    setActiveCollection(name);
    clearSearch();
  };

  return (
    <div style={{ padding: "14px 10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: 8 }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
        }}>
          Collections
        </span>
        <button
          onClick={() => setShowCreate((v) => !v)}
          title="New collection"
          style={{
            width: 22, height: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 5,
            background: showCreate ? "rgba(59,130,246,0.18)" : "transparent",
            border: `1px solid ${showCreate ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: showCreate ? "rgba(99,160,255,0.9)" : "rgba(255,255,255,0.35)",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            transition: "all 0.15s",
          }}
        >+</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: 6, marginBottom: 8, padding: "0 2px" }}
        >
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="my-collection"
            pattern="[a-zA-Z0-9_\-]+"
            title="Letters, numbers, dashes and underscores only"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 12,
              fontFamily: '"Outfit", sans-serif',
              color: "rgba(255,255,255,0.85)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            style={{
              background: "rgba(59,130,246,0.85)",
              border: "none",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 500,
              color: "white",
              cursor: creating || !newName.trim() ? "not-allowed" : "pointer",
              opacity: creating || !newName.trim() ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {creating ? "…" : "Add"}
          </button>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ padding: "12px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
          {[60, 80, 50].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 32, width: `${w}%` }} />
          ))}
        </div>
      )}

      {/* Collection items */}
      {collections.map((col) => {
        const isActive = activeCollection === col.name;
        return (
          <div
            key={col.name}
            onClick={() => handleSelect(col.name)}
            className="group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 7,
              cursor: "pointer",
              background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
              border: `1px solid ${isActive ? "rgba(59,130,246,0.22)" : "transparent"}`,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {/* Color dot */}
            <div style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: isActive ? "#3b82f6" : "rgba(255,255,255,0.2)",
              boxShadow: isActive ? "0 0 6px rgba(59,130,246,0.6)" : "none",
              transition: "all 0.15s",
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.62)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}>
                {col.name}
              </p>
              <p style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                marginTop: 1,
              }}>
                {col.point_count.toLocaleString()} pts
                {!col.umap_ready && (
                  <span style={{ color: "rgba(250,204,21,0.55)", marginLeft: 5 }}>· pending</span>
                )}
              </p>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => { e.stopPropagation(); del(col.name); }}
              title="Delete"
              style={{
                width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 4,
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.18)",
                cursor: "pointer",
                fontSize: 11,
                opacity: 0,
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              className="group-hover:!opacity-100"
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(248,113,113,0.85)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
            >✕</button>
          </div>
        );
      })}

      {!isLoading && collections.length === 0 && (
        <p style={{
          textAlign: "center",
          padding: "20px 0",
          fontSize: 12,
          color: "rgba(255,255,255,0.18)",
          fontStyle: "italic",
        }}>No collections yet</p>
      )}
    </div>
  );
}
