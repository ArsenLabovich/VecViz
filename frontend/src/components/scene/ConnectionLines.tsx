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

  const S = 1.8;
  const qp = searchResult.query_point;
  const results = searchResult.results;

  return (
    <group ref={groupRef}>
      {results.map((r, i) => (
        <Line
          key={r.id}
          from={[qp.x * S, qp.y * S, qp.z * S]}
          to={[r.x * S, r.y * S, r.z * S]}
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
  const matRef = useRef<THREE.LineBasicMaterial>(null!);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
  }, [from, to]);

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    const progress = Math.max(0, progressRef.current - delay);
    mat.opacity = Math.min(opacity * 0.8, progress * 2) * opacity;
  });

  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: "#88ccff", transparent: true, opacity: 0 });
    matRef.current = mat;
    return new THREE.Line(geometry, mat);
  }, [geometry]);

  return <primitive object={lineObj} />;
}
