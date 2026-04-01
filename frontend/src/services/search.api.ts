import { api } from "./api";
import type { SearchResponse } from "@/types/search";

export const searchApi = {
  search: (collection: string, query: string, k = 10) =>
    api
      .post<SearchResponse>(`/collections/${collection}/search`, { query, k })
      .then((r) => r.data),
};
