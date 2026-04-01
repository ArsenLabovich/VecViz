export interface SearchResultItem {
  id: string;
  x: number;
  y: number;
  z: number;
  text_preview: string;
  score: number;
}

export interface SearchResponse {
  query_point: { x: number; y: number; z: number };
  results: SearchResultItem[];
}

export interface SSEEvent {
  event: "progress" | "done" | "error";
  data: {
    stage?: string;
    percent?: number;
    message?: string;
    document_id?: string;
    chunks_created?: number;
    processing_time_ms?: number;
  };
}
