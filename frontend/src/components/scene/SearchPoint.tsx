import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "@/stores/sceneStore";

const TARGET_COLOR = new THREE.Color("#ffffff");
const LERP_SPEED = 0.06;

export function SearchPoint() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const posRef = useRef(new THREE.Vector3(0, 0, 200)); // start off-screen
  const arrivedRef = useRef(false);
  const { camera } = useThree();

  const searchResult = useSceneStore((s) => s.searchResult);
  const setAnimating = useSceneStore((s) => s.setSearchAnimating);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!searchResult) {
      // Reset position off-screen
      posRef.current.set(0, 0, 200);
      arrivedRef.current = false;
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    const target = new THREE.Vector3(
      searchResult.query_point.x,
      searchResult.query_point.y,
      searchResult.query_point.z
    );

    // First frame: snap to camera position
    if (!arrivedRef.current && posRef.current.z === 200) {
      posRef.current.copy(camera.position).multiplyScalar(0.6);
    }

    posRef.current.lerp(target, LERP_SPEED);
    mesh.position.copy(posRef.current);

    const dist = posRef.current.distanceTo(target);
    if (dist < 1.0 && !arrivedRef.current) {
      arrivedRef.current = true;
      setAnimating(false);
    }

    // Pulse scale
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2;
    mesh.scale.setScalar(pulse);
  });

  if (!searchResult) return null;

  return (
    <Trail
      width={1.5}
      length={8}
      color={TARGET_COLOR}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={3}
          roughness={0}
          metalness={0}
        />
      </mesh>
    </Trail>
  );
}
