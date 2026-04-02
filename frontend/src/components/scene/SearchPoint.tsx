import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Trail, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "@/stores/sceneStore";
import type { SearchResultItem } from "@/types/search";

const S = 1.8; // must match PointCloud SPREAD
const TARGET_COLOR = new THREE.Color("#ffffff");
const LERP_SPEED = 0.07;

// Small sphere at the query point position — shows where the search vector landed
function SearchSphere({ queryPoint, results, query }: {
  queryPoint: { x: number; y: number; z: number };
  results: SearchResultItem[];
  query?: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  const px = queryPoint.x * S;
  const py = queryPoint.y * S;
  const pz = queryPoint.z * S;
  const R = 5; // fixed small radius

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.7;
      ringRef.current.rotation.x = t * 0.3;
    }
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + Math.sin(t * 2) * 0.03;
    }
  });

  return (
    <group position={[px, py, pz]}>
      {/* Translucent inner sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[R, 24, 24]} />
        <meshBasicMaterial
          color="#4477ff"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Thin wireframe */}
      <mesh>
        <sphereGeometry args={[R * 1.05, 14, 14]} />
        <meshBasicMaterial
          color="#5588ff"
          transparent
          opacity={0.20}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[R * 0.9, 0.25, 6, 48]} />
        <meshBasicMaterial
          color="#88aaff"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, R + 4, 0]}
        fontSize={2.8}
        color="#99bbff"
        anchorX="center"
        anchorY="bottom"
        fillOpacity={0.9}
        outlineWidth={0.25}
        outlineColor="#000020"
        outlineOpacity={0.9}
        renderOrder={10}
      >
        {`${results.length} result${results.length !== 1 ? "s" : ""}`}
      </Text>
      {query && (
        <Text
          position={[0, R + 8, 0]}
          fontSize={2.0}
          color="#6677aa"
          anchorX="center"
          anchorY="bottom"
          fillOpacity={0.75}
          outlineWidth={0.15}
          outlineColor="#000020"
          outlineOpacity={0.8}
          renderOrder={10}
        >
          {`"${query}"`}
        </Text>
      )}
    </group>
  );
}

export function SearchPoint() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const posRef = useRef(new THREE.Vector3(0, 0, 200));
  const arrivedRef = useRef(false);
  const { camera } = useThree();

  const searchResult = useSceneStore((s) => s.searchResult);
  const setAnimating = useSceneStore((s) => s.setSearchAnimating);
  const setCameraTarget = useSceneStore((s) => s.setCameraTarget);

  useEffect(() => {
    if (!searchResult) {
      arrivedRef.current = false;
      posRef.current.set(0, 0, 200);
      return;
    }
    const pts = searchResult.results;
    if (!pts.length) return;
    let cx = 0, cy = 0, cz = 0;
    pts.forEach(r => { cx += r.x * S; cy += r.y * S; cz += r.z * S; });
    cx /= pts.length; cy /= pts.length; cz /= pts.length;
    console.log("[SearchPoint] fly-to centroid:", [cx, cy, cz]);
    setCameraTarget([cx, cy, cz]);
  }, [searchResult, setCameraTarget]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!searchResult) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    const target = new THREE.Vector3(
      searchResult.query_point.x * S,
      searchResult.query_point.y * S,
      searchResult.query_point.z * S,
    );

    if (!arrivedRef.current && posRef.current.z === 200) {
      posRef.current.copy(camera.position).multiplyScalar(0.6);
    }

    posRef.current.lerp(target, LERP_SPEED);
    mesh.position.copy(posRef.current);

    if (posRef.current.distanceTo(target) < 1.5 && !arrivedRef.current) {
      arrivedRef.current = true;
      setAnimating(false);
    }

    mesh.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.25);
  });

  if (!searchResult) return null;

  return (
    <>
      <Trail width={2} length={10} color={TARGET_COLOR} attenuation={(t) => t * t}>
        <mesh ref={meshRef} visible={false}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#4488ff"
            emissiveIntensity={4}
            roughness={0}
            metalness={0}
          />
        </mesh>
      </Trail>

      <SearchSphere queryPoint={searchResult.query_point} results={searchResult.results} query={searchResult.query} />
    </>
  );
}
