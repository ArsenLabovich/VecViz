import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSceneStore } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";
import { pointsApi } from "@/services/points.api";
import type { PointDetail } from "@/types/point";

export function DetailPanel() {
  const selectedId = useSceneStore((s) => s.selectedPointId);
  const setSelected = useSceneStore((s) => s.setSelected);
  const activeCollection = useUIStore((s) => s.activeCollection);
  const [point, setPoint] = useState<PointDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId || !activeCollection) {
      setPoint(null);
      return;
    }
    setLoading(true);
    pointsApi
      .get(activeCollection, selectedId)
      .then(setPoint)
      .catch(() => setPoint(null))
      .finally(() => setLoading(false));
  }, [selectedId, activeCollection]);

  const isOpen = !!selectedId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="detail"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 flex w-72 flex-col border-l border-white/8 bg-black/60 backdrop-blur-md overflow-y-auto"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-sm font-semibold text-white/80">Chunk Detail</span>
            <button
              onClick={() => setSelected(null)}
              className="text-white/30 hover:text-white/70 transition"
            >✕</button>
          </div>

          <div className="flex-1 p-4">
            {loading && (
              <div className="space-y-2">
                {[80, 100, 60, 90].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-white/10 animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}

            {point && !loading && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/30 mb-1 uppercase tracking-wider">Text</p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                    {point.text}
                  </p>
                </div>

                <div className="border-t border-white/8 pt-3 space-y-1.5 text-xs text-white/40">
                  <Row label="Source" value={point.filename} />
                  <Row label="Chunk" value={`#${point.chunk_index}`} />
                  <Row label="Tokens" value={String(point.token_count)} />
                  {point.cluster_label && (
                    <Row label="Cluster" value={point.cluster_label} />
                  )}
                  <Row label="Position" value={`(${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)})`} />
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-white/25">{label}:</span>
      <span className="text-white/50 truncate">{value}</span>
    </div>
  );
}
