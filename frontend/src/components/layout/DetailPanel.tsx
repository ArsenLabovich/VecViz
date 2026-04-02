import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSceneStore } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";
import { pointsApi } from "@/services/points.api";
import type { PointDetail } from "@/types/point";

const S = {
  panel: {
    position: "relative" as const,
    zIndex: 10,
    width: 280,
    display: "flex",
    flexDirection: "column" as const,
    background: "rgba(3,10,24,0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderLeft: "1px solid rgba(255,255,255,0.07)",
    overflowY: "auto" as const,
    flexShrink: 0,
  },
};

export function DetailPanel() {
  const selectedId = useSceneStore((s) => s.selectedPointId);
  const setSelected = useSceneStore((s) => s.setSelected);
  const activeCollection = useUIStore((s) => s.activeCollection);
  const [point, setPoint] = useState<PointDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId || !activeCollection) { setPoint(null); return; }
    setLoading(true);
    pointsApi.get(activeCollection, selectedId)
      .then(setPoint).catch(() => setPoint(null))
      .finally(() => setLoading(false));
  }, [selectedId, activeCollection]);

  return (
    <AnimatePresence>
      {!!selectedId && (
        <motion.aside
          key="detail"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          style={S.panel}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#3b82f6",
                boxShadow: "0 0 6px rgba(59,130,246,0.7)",
              }} />
              <span style={{
                fontSize: 12, fontWeight: 600,
                letterSpacing: "0.03em",
                color: "rgba(255,255,255,0.75)",
              }}>Chunk Detail</span>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                width: 22, height: 22,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 5,
                color: "rgba(255,255,255,0.28)",
                cursor: "pointer",
                fontSize: 11,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.28)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              }}
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: "14px", overflowY: "auto" }}>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[90, 100, 75, 88, 60].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 12, width: `${w}%` }} />
                ))}
              </div>
            )}

            {point && !loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Text content */}
                <div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: 8,
                  }}>Content</div>
                  <p style={{
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.72)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {point.text}
                  </p>
                </div>

                {/* Metadata */}
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: 2,
                  }}>Metadata</div>
                  <MetaRow label="Source" value={point.filename} />
                  <MetaRow label="Chunk" value={`#${point.chunk_index}`} mono />
                  <MetaRow label="Tokens" value={String(point.token_count)} mono />
                  {point.cluster_label && (
                    <MetaRow label="Cluster" value={point.cluster_label} />
                  )}
                  <MetaRow
                    label="XYZ"
                    value={`${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)}`}
                    mono
                  />
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, flexShrink: 0,
        color: "rgba(255,255,255,0.22)",
        width: 46,
      }}>{label}</span>
      <span style={{
        fontSize: mono ? 10.5 : 12,
        fontFamily: mono ? '"JetBrains Mono", monospace' : '"Outfit", sans-serif',
        color: "rgba(255,255,255,0.55)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>{value}</span>
    </div>
  );
}
