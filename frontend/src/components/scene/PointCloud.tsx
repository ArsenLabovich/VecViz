import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { PointBrief } from "@/types/point";
import { useSceneStore } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";
import type { ThreeEvent } from "@react-three/fiber";

interface Props {
  points: PointBrief[];
}

const POINT_SIZE = 3.5;
const SPREAD = 1.8;

function makeCircleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
  grad.addColorStop(0,   "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.85)");
  grad.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const circleTexture = makeCircleTexture();

function shortLabel(point: PointBrief): string {
  if (point.label) return point.label;
  return point.text_preview.replace(/\s+/g, " ").trim().split(" ").slice(0, 4).join(" ");
}

function RotatingLabel({ point, index, isNeighbor, hasSearch }: {
  point: PointBrief;
  index: number;
  isNeighbor: boolean;
  hasSearch: boolean;
}) {
  const ref = useRef<THREE.Group>(null!);
  const phase = (index * 1.618) % (Math.PI * 2);
  const bobAmp = 0.4 + (index % 5) * 0.15;

  const opacity = hasSearch ? (isNeighbor ? 1.0 : 0.03) : 0.75;

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.position.y = point.y * SPREAD + 3.5 + Math.sin(t * 0.7 + phase) * bobAmp;
  });

  return (
    <group ref={ref} position={[point.x * SPREAD, point.y * SPREAD + 3.5, point.z * SPREAD]}>
      <Text
        fontSize={1.1}
        color={point.color || "#aaaaff"}
        anchorX="center"
        anchorY="bottom"
        fillOpacity={opacity}
        outlineWidth={0.12}
        outlineColor="#000000"
        outlineOpacity={opacity * 0.8}
        maxWidth={20}
        textAlign="center"
      >
        {shortLabel(point)}
      </Text>
    </group>
  );
}

export function PointCloud({ points }: Props) {
  const colRef   = useRef<THREE.BufferAttribute>(null!);
  const matRef   = useRef<THREE.PointsMaterial>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  const hoveredId  = useSceneStore((s) => s.hoveredPointId);
  const selectedId = useSceneStore((s) => s.selectedPointId);
  const searchResult = useSceneStore((s) => s.searchResult);
  const setHovered = useSceneStore((s) => s.setHovered);
  const setSelected = useSceneStore((s) => s.setSelected);
  const setDetailPanelOpen = useUIStore((s) => s.setDetailPanelOpen);

  const searchNeighborIds = useMemo(() => {
    if (!searchResult) return null;
    return new Set(searchResult.results.map((r) => r.id));
  }, [searchResult]);

  const { positions, colors, idMap } = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors    = new Float32Array(points.length * 3);
    const idMap: Record<number, string> = {};
    const c = new THREE.Color();
    points.forEach((p, i) => {
      positions[i * 3]     = p.x * SPREAD;
      positions[i * 3 + 1] = p.y * SPREAD;
      positions[i * 3 + 2] = p.z * SPREAD;
      idMap[i] = p.id;
      c.set(p.color || "#4488ff");
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    });
    return { positions, colors, idMap };
  }, [points]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (matRef.current) {
      matRef.current.size = POINT_SIZE * (1 + 0.08 * Math.sin(t * 0.25));
    }

    const col = colRef.current;
    if (!col || !points.length) return;
    const hasSearch = !!searchNeighborIds;

    const cc = new THREE.Color();
    let changed = false;

    points.forEach((p, i) => {
      const isHovered  = p.id === hoveredId;
      const isSelected = p.id === selectedId;
      const isNeighbor = searchNeighborIds?.has(p.id) ?? false;

      if (isHovered || isSelected)       cc.set("#ffffff");
      else if (hasSearch && isNeighbor)  cc.set(p.color).multiplyScalar(3.5);
      else if (hasSearch && !isNeighbor) cc.set(p.color).multiplyScalar(0.05);
      else                               cc.set(p.color || "#4488ff");

      const idx = i * 3;
      const arr = col.array as Float32Array;
      if (arr[idx] !== cc.r || arr[idx+1] !== cc.g || arr[idx+2] !== cc.b) {
        arr[idx] = cc.r; arr[idx+1] = cc.g; arr[idx+2] = cc.b;
        changed = true;
      }
    });
    if (changed) col.needsUpdate = true;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx !== undefined && idMap[idx]) { setSelected(idMap[idx]); setDetailPanelOpen(true); }
  };
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const idx = e.index;
    if (idx !== undefined && idMap[idx]) { setHovered(idMap[idx]); document.body.style.cursor = "pointer"; }
  };
  const handlePointerOut = () => { setHovered(null); document.body.style.cursor = "auto"; };

  if (!points.length) return null;

  return (
    <group ref={groupRef}>
      {/* Points */}
      <points onClick={handleClick} onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute ref={colRef} attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={matRef} size={POINT_SIZE} vertexColors sizeAttenuation transparent alphaTest={0.05} map={circleTexture} depthWrite={false} />
      </points>

      {/* Labels — rotating, dimmed during search */}
      {points.map((p, i) => (
        <RotatingLabel
          key={p.id}
          point={p}
          index={i}
          isNeighbor={searchNeighborIds?.has(p.id) ?? false}
          hasSearch={!!searchNeighborIds}
        />
      ))}
    </group>
  );
}
