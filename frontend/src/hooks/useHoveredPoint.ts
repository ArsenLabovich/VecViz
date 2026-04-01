import { useCallback } from "react";
import { useSceneStore } from "@/stores/sceneStore";

export function useHoveredPoint() {
  const hoveredPointId = useSceneStore((s) => s.hoveredPointId);
  const setHovered = useSceneStore((s) => s.setHovered);
  const setSelected = useSceneStore((s) => s.setSelected);

  const onPointerOver = useCallback((id: string) => setHovered(id), [setHovered]);
  const onPointerOut = useCallback(() => setHovered(null), [setHovered]);
  const onClick = useCallback((id: string) => setSelected(id), [setSelected]);

  return { hoveredPointId, onPointerOver, onPointerOut, onClick };
}
