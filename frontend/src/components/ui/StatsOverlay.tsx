import { usePoints } from "@/hooks/usePoints";
import { useUIStore } from "@/stores/uiStore";

export function StatsOverlay() {
  const collection = useUIStore((s) => s.activeCollection);
  const { data } = usePoints(collection);

  if (!collection || !data) return null;

  return (
    <div style={{
      pointerEvents: "none",
      position: "absolute",
      bottom: 80,
      right: 16,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 4,
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        color: "rgba(255,255,255,0.22)",
        letterSpacing: "0.04em",
      }}>
        {data.total.toLocaleString()} pts
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9,
        letterSpacing: "0.06em",
        color: data.umap_ready ? "rgba(74,222,128,0.45)" : "rgba(250,204,21,0.45)",
      }}>
        {data.umap_ready ? "● ready" : "○ pending"}
      </div>
    </div>
  );
}
