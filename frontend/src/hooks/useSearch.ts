import { useMutation } from "@tanstack/react-query";
import { searchApi } from "@/services/search.api";
import { useSceneStore } from "@/stores/sceneStore";

export function useSearch(collection: string | null) {
  const setSearchResult = useSceneStore((s) => s.setSearchResult);
  const clearSearch = useSceneStore((s) => s.clearSearch);

  return useMutation({
    mutationFn: ({ query, k }: { query: string; k?: number }) =>
      searchApi.search(collection!, query, k),
    onSuccess: (data) => setSearchResult(data),
    onError: () => clearSearch(),
    onMutate: () => clearSearch(),
  });
}
