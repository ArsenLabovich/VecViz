import { useState, useCallback } from "react";
import { uploadApi } from "@/services/upload.api";
import { useUIStore } from "@/stores/uiStore";
import { useInvalidatePoints } from "./usePoints";
import { useQueryClient } from "@tanstack/react-query";
import { COLLECTIONS_KEY } from "./useCollections";

export function useUpload(collection: string | null) {
  const [error, setError] = useState<string | null>(null);
  const setProgress = useUIStore((s) => s.setUploadProgress);
  const invalidate = useInvalidatePoints();
  const qc = useQueryClient();

  const upload = useCallback(
    async (file: File, chunkSize = 512, chunkOverlap = 50) => {
      if (!collection) return;
      setError(null);
      setProgress(0, "uploading");

      try {
        const { document_id } = await uploadApi.uploadFile(
          collection,
          file,
          chunkSize,
          chunkOverlap,
          (pct) => setProgress(pct, "uploading")
        );

        // Subscribe to SSE for processing progress
        await new Promise<void>((resolve, reject) => {
          const es = uploadApi.subscribeStatus(collection, (event, data: any) => {
            if (event === "progress") {
              setProgress(data.percent ?? 50, data.stage ?? null);
            } else if (event === "done") {
              setProgress(null, null);
              es.close();
              invalidate(collection);
              qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
              resolve();
            } else if (event === "error") {
              setProgress(null, null);
              es.close();
              reject(new Error(data.message ?? "Processing failed"));
            }
          });

          // Timeout safety — close after 10 minutes
          setTimeout(() => {
            es.close();
            resolve();
          }, 600_000);
        });
      } catch (e: any) {
        setProgress(null, null);
        setError(e?.message ?? "Upload failed");
      }
    },
    [collection]
  );

  return { upload, error };
}
