import { api } from "./api";
import type { Collection, CollectionCreate, DocumentInfo } from "@/types/collection";

export const collectionsApi = {
  list: () => api.get<{ collections: Collection[] }>("/collections").then((r) => r.data.collections),

  create: (body: CollectionCreate) =>
    api.post<Collection>("/collections", body).then((r) => r.data),

  delete: (name: string) => api.delete(`/collections/${name}`),

  listDocuments: (name: string) =>
    api.get<{ documents: DocumentInfo[] }>(`/collections/${name}/documents`).then((r) => r.data.documents),
};
