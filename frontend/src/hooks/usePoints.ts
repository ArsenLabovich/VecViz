import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pointsApi } from "@/services/points.api";

export const pointsKey = (collection: string) => ["points", collection] as const;
export const clustersKey = (collection: string) => ["clusters", collection] as const;

export function usePoints(collection: string | null) {
  return useQuery({
    queryKey: pointsKey(collection ?? ""),
    queryFn: () => pointsApi.list(collection!, { limit: 10000 }),
    enabled: !!collection,
    staleTime: 30_000,
  });
}

export function useClusters(collection: string | null) {
  return useQuery({
    queryKey: clustersKey(collection ?? ""),
    queryFn: () => pointsApi.getClusters(collection!),
    enabled: !!collection,
    staleTime: 30_000,
  });
}

export function useInvalidatePoints() {
  const qc = useQueryClient();
  return (collection: string) => {
    qc.invalidateQueries({ queryKey: pointsKey(collection) });
    qc.invalidateQueries({ queryKey: clustersKey(collection) });
  };
}
