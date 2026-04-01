import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { usePoints } from "@/hooks/usePoints";
import { useUIStore } from "@/stores/uiStore";

// Standalone overlay — lives outside Canvas
export function StatsOverlay() {
  const collection = useUIStore((s) => s.activeCollection);
  const { data } = usePoints(collection);

  if (!collection || !data) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-1 text-xs text-white/30 font-mono">
      <span>{data.total.toLocaleString()} points</span>
      {data.umap_ready ? (
        <span className="text-green-500/50">layout ready</span>
      ) : (
        <span className="text-yellow-500/50">layout pending</span>
      )}
    </div>
  );
}
