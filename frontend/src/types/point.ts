export interface PointBrief {
  id: string;
  x: number;
  y: number;
  z: number;
  text_preview: string;
  label: string | null;
  document_id: string;
  filename: string;
  cluster_id: number | null;
  cluster_label: string | null;
  color: string;
}

export interface PointDetail {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  document_id: string;
  filename: string;
  chunk_index: number;
  token_count: number;
  cluster_id: number | null;
  cluster_label: string | null;
  metadata: Record<string, unknown>;
}

export interface PointsResponse {
  points: PointBrief[];
  total: number;
  umap_ready: boolean;
}

export interface ClusterInfo {
  cluster_id: number;
  label: string | null;
  point_count: number;
  centroid: { x: number; y: number; z: number };
  color: string;
}
