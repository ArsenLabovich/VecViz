export interface Collection {
  name: string;
  description: string;
  point_count: number;
  document_count: number;
  reduction_method: "umap" | "pacmap";
  umap_ready: boolean;
  created_at: string;
}

export interface CollectionCreate {
  name: string;
  description?: string;
  reduction_method?: "umap" | "pacmap";
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  chunk_count: number;
  created_at: string;
}
