import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "@/stores/sceneStore";

export function CameraController() {
  const { camera } = useThree();
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const cameraTarget = useSceneStore((s) => s.cameraTarget);
  const setCameraTarget = useSceneStore((s) => s.setCameraTarget);

  useFrame(() => {
    if (!cameraTarget) return;

    if (!targetRef.current) {
      targetRef.current = new THREE.Vector3(...cameraTarget);
    }

    const dest = new THREE.Vector3(...cameraTarget).multiplyScalar(1.0);
    const camDest = dest.clone().normalize().multiplyScalar(80);

    camera.position.lerp(camDest, 0.04);

    const dist = camera.position.distanceTo(camDest);
    if (dist < 1.0) {
      setCameraTarget(null);
      targetRef.current = null;
    }
  });

  return null;
}
