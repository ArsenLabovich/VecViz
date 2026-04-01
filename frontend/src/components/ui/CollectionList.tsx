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
    <div className="flex flex-col gap-1 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Collections</span>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="text-white/40 hover:text-white/80 transition text-lg leading-none"
          title="New collection"
        >+</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex gap-1 mb-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="collection-name"
            className="flex-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs text-white outline-none focus:border-blue-500/60"
            pattern="[a-zA-Z0-9_\-]+"
            title="Letters, numbers, dashes and underscores only"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            {creating ? "…" : "Create"}
          </button>
        </form>
      )}

      {isLoading && <p className="text-xs text-white/30 py-2 text-center">Loading…</p>}

      {collections.map((col) => (
        <div
          key={col.name}
          onClick={() => handleSelect(col.name)}
          className={`group flex items-center justify-between rounded-md px-2.5 py-2 cursor-pointer transition
            ${activeCollection === col.name ? "bg-blue-600/25 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{col.name}</p>
            <p className="text-xs text-white/30 mt-0.5">
              {col.point_count.toLocaleString()} pts
              {!col.umap_ready && <span className="ml-1 text-yellow-500/70">· layout pending</span>}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); del(col.name); }}
            className="ml-2 hidden group-hover:block text-white/30 hover:text-red-400 transition text-xs"
            title="Delete collection"
          >✕</button>
        </div>
      ))}

      {!isLoading && collections.length === 0 && (
        <p className="text-xs text-white/20 py-3 text-center">No collections yet</p>
      )}
    </div>
  );
}
