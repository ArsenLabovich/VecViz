import { api } from "./api";
import type { SearchResponse } from "@/types/search";

export const searchApi = {
  search: (collection: string, query: string, k = 20, min_score = 0) =>
    api
      .post<SearchResponse>(`/collections/${collection}/search`, { query, k, min_score })
      .then((r) => ({ ...r.data, query })),
};
