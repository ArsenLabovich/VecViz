import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { PointBrief } from "@/types/point";

interface Props {
  points: PointBrief[];
}

const SPREAD = 1.8;
const LABEL_DISTANCE = 120;
const MAX_LABELS = 150;

function shortLabel(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  return words.slice(0, 4).join(" ");
}

export function PointLabels({ points }: Props) {
  const { camera } = useThree();
  const visibleRef = useRef<number[]>([]);

  useFrame(() => {
    const camPos = camera.position;
    const dists = points.map((p, i) => {
      const dx = p.x * SPREAD - camPos.x;
      const dy = p.y * SPREAD - camPos.y;
      const dz = p.z * SPREAD - camPos.z;
      return { i, d: Math.sqrt(dx*dx + dy*dy + dz*dz) };
    });
    dists.sort((a, b) => a.d - b.d);
    visibleRef.current = dists
      .filter((x) => x.d < LABEL_DISTANCE)
      .slice(0, MAX_LABELS)
      .map((x) => x.i);
  });

  if (!points.length) return null;

  return (
    <>
      {points.map((p, i) => (
        <PointLabel key={p.id} point={p} index={i} visibleRef={visibleRef} />
      ))}
    </>
  );
}

function PointLabel({
  point,
  index,
  visibleRef,
}: {
  point: PointBrief;
  index: number;
  visibleRef: React.MutableRefObject<number[]>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (!ref.current) return;
    const visible = visibleRef.current.includes(index);
    ref.current.style.display = visible ? "block" : "none";
  });

  return (
    <Html
      position={[point.x * SPREAD, point.y * SPREAD + 2.5, point.z * SPREAD]}
      center
      distanceFactor={30}
      zIndexRange={[0, 10]}
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={ref}
        style={{
          display: "none",
          color: point.color || "#aaaaff",
          fontSize: "9px",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          opacity: 0.7,
          textShadow: "0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
          userSelect: "none",
        }}
      >
        {shortLabel(point.text_preview)}
      </div>
    </Html>
  );
}
