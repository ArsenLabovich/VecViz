import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "@/stores/sceneStore";

export function ConnectionLines() {
  const groupRef = useRef<THREE.Group>(null!);
  const progressRef = useRef(0);
  const searchResult = useSceneStore((s) => s.searchResult);
  const isAnimating = useSceneStore((s) => s.isSearchAnimating);

  // Reset draw progress when search changes
  useMemo(() => {
    progressRef.current = 0;
  }, [searchResult]);

  useFrame((_, delta) => {
    if (!searchResult || isAnimating) {
      progressRef.current = 0;
      return;
    }
    progressRef.current = Math.min(1, progressRef.current + delta * 1.5);
  });

  if (!searchResult) return null;

  const qp = searchResult.query_point;
  const results = searchResult.results;

  return (
    <group ref={groupRef}>
      {results.map((r, i) => (
        <Line
          key={r.id}
          from={[qp.x, qp.y, qp.z]}
          to={[r.x, r.y, r.z]}
          opacity={r.score}
          delay={i * 0.05}
          progressRef={progressRef}
        />
      ))}
    </group>
  );
}

interface LineProps {
  from: [number, number, number];
  to: [number, number, number];
  opacity: number;
  delay: number;
  progressRef: React.MutableRefObject<number>;
}

function Line({ from, to, opacity, delay, progressRef }: LineProps) {
  const ref = useRef<THREE.Line>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
    return geo;
  }, [from, to]);

  useFrame(() => {
    const line = ref.current;
    if (!line) return;
    const mat = line.material as THREE.LineBasicMaterial;
    const progress = Math.max(0, progressRef.current - delay);
    mat.opacity = Math.min(opacity * 0.8, progress * 2) * opacity;
  });

  return (
    <line ref={ref as any} geometry={geometry}>
      <lineBasicMaterial
        color="#88ccff"
        transparent
        opacity={0}
        linewidth={1}
      />
    </line>
  );
}
