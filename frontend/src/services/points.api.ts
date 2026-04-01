import { api } from "./api";
import type { PointDetail, PointsResponse, ClusterInfo } from "@/types/point";

export const pointsApi = {
  list: (
    collection: string,
    params?: { limit?: number; offset?: number; cluster_id?: number; document_id?: string }
  ) =>
    api
      .get<PointsResponse>(`/collections/${collection}/points`, { params })
      .then((r) => r.data),

  get: (collection: string, id: string) =>
    api.get<PointDetail>(`/collections/${collection}/points/${id}`).then((r) => r.data),

  refit: (
    collection: string,
    body: { n_neighbors?: number; min_dist?: number; method?: string }
  ) => api.post(`/collections/${collection}/points/refit`, body),

  getClusters: (collection: string) =>
    api.get<{ clusters: ClusterInfo[] }>(`/collections/${collection}/clusters`).then((r) => r.data.clusters),

  recomputeClusters: (
    collection: string,
    body: { min_cluster_size?: number; min_samples?: number }
  ) => api.post(`/collections/${collection}/clusters/recompute`, body),

  generateClusterLabel: (collection: string, clusterId: number) =>
    api.post(`/collections/${collection}/clusters/${clusterId}/label`),
};
