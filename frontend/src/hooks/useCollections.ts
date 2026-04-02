import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { collectionsApi } from "@/services/collections.api";
import { useUIStore } from "@/stores/uiStore";
import type { CollectionCreate } from "@/types/collection";

export const COLLECTIONS_KEY = ["collections"] as const;

export function useCollections() {
  const activeCollection = useUIStore((s) => s.activeCollection);
  const setActiveCollection = useUIStore((s) => s.setActiveCollection);

  const query = useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: collectionsApi.list,
    refetchInterval: false,
  });

  // Reset active collection if it no longer exists
  useEffect(() => {
    if (query.data && activeCollection) {
      const exists = query.data.some((c) => c.name === activeCollection);
      if (!exists) setActiveCollection(null);
    }
  }, [query.data, activeCollection, setActiveCollection]);

  return query;
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CollectionCreate) => collectionsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  const activeCollection = useUIStore((s) => s.activeCollection);
  const setActiveCollection = useUIStore((s) => s.setActiveCollection);
  return useMutation({
    mutationFn: (name: string) => collectionsApi.delete(name),
    onSuccess: (_, name) => {
      if (activeCollection === name) setActiveCollection(null);
      qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
    },
  });
}
