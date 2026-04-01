import { api } from "./api";

export const uploadApi = {
  uploadFile: (
    collection: string,
    file: File,
    chunkSize = 512,
    chunkOverlap = 50,
    onProgress?: (percent: number) => void
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("chunk_size", String(chunkSize));
    form.append("chunk_overlap", String(chunkOverlap));
    return api
      .post<{ document_id: string; status: string }>(
        `/collections/${collection}/documents`,
        form,
        {
          onUploadProgress: (e) => {
            if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
          },
        }
      )
      .then((r) => r.data);
  },

  uploadText: (
    collection: string,
    text: string,
    metadata?: Record<string, unknown>,
    chunkSize = 512,
    chunkOverlap = 50
  ) =>
    api
      .post<{ document_id: string; status: string }>(`/collections/${collection}/text`, {
        text,
        metadata,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      })
      .then((r) => r.data),

  subscribeStatus: (
    collection: string,
    onEvent: (event: string, data: unknown) => void
  ): EventSource => {
    const base = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : "/api";
    const es = new EventSource(`${base}/collections/${collection}/status`);
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed.event, parsed.data);
      } catch {
        /* ignore malformed */
      }
    };
    return es;
  },
};
