import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionsApi } from "@/services/collections.api";
import type { CollectionCreate } from "@/types/collection";

export const COLLECTIONS_KEY = ["collections"] as const;

export function useCollections() {
  return useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: collectionsApi.list,
    refetchInterval: false,
  });
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
  return useMutation({
    mutationFn: (name: string) => collectionsApi.delete(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: COLLECTIONS_KEY }),
  });
}
