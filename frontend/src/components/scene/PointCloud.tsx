import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { BVH } from "@react-three/drei";
import * as THREE from "three";
import type { PointBrief } from "@/types/point";
import { useSceneStore } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";

interface Props {
  points: PointBrief[];
}

const POINT_RADIUS = 0.4;
const SPHERE_SEGS = 8;

export function PointCloud({ points }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const colorRef = useRef<THREE.InstancedBufferAttribute | null>(null);

  const hoveredId = useSceneStore((s) => s.hoveredPointId);
  const selectedId = useSceneStore((s) => s.selectedPointId);
  const searchResult = useSceneStore((s) => s.searchResult);
  const setHovered = useSceneStore((s) => s.setHovered);
  const setSelected = useSceneStore((s) => s.setSelected);
  const setDetailPanelOpen = useUIStore((s) => s.setDetailPanelOpen);

  const searchNeighborIds = useMemo(() => {
    if (!searchResult) return null;
    return new Set(searchResult.results.map((r) => r.id));
  }, [searchResult]);

  // Build instanced positions + colors on points change
  const { positions, colors, idMap } = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const idMap: Record<number, string> = {};

    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      idMap[i] = p.id;

      const c = new THREE.Color(p.color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });

    return { positions, colors, idMap };
  }, [points]);

  // Set instance matrices on mount / points change
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    points.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [points]);

  // Update colors each frame based on hover/search state
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !points.length) return;

    const c = new THREE.Color();
    points.forEach((p, i) => {
      const isHovered = p.id === hoveredId;
      const isSelected = p.id === selectedId;
      const isNeighbor = searchNeighborIds?.has(p.id) ?? false;
      const hasSearch = !!searchNeighborIds;

      if (isHovered || isSelected) {
        c.set("#ffffff");
      } else if (hasSearch && isNeighbor) {
        c.set(p.color).multiplyScalar(2.5); // bright
      } else if (hasSearch && !isNeighbor) {
        c.set(p.color).multiplyScalar(0.15); // dim
      } else {
        c.set(p.color);
      }

      mesh.setColorAt(i, c);
    });

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const idx = e.instanceId;
      if (idx !== undefined && idMap[idx]) {
        setHovered(idMap[idx]);
        document.body.style.cursor = "pointer";
      }
    },
    [idMap, setHovered]
  );

  const handlePointerOut = useCallback(() => {
    setHovered(null);
    document.body.style.cursor = "auto";
  }, [setHovered]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const idx = e.instanceId;
      if (idx !== undefined && idMap[idx]) {
        setSelected(idMap[idx]);
        setDetailPanelOpen(true);
      }
    },
    [idMap, setSelected, setDetailPanelOpen]
  );

  if (!points.length) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, points.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      frustumCulled={false}
    >
      <BVH />
      <sphereGeometry args={[POINT_RADIUS, SPHERE_SEGS, SPHERE_SEGS]} />
      <meshStandardMaterial
        vertexColors
        roughness={0.3}
        metalness={0.1}
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}
