import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "@/stores/sceneStore";
import { useUIStore } from "@/stores/uiStore";

const SPEED = 0.5; // units per frame at 60fps

export function CameraController() {
  const targetRef = useRef<THREE.Vector3 | null>(null);
  const cameraTarget   = useSceneStore((s) => s.cameraTarget);
  const setCameraTarget = useSceneStore((s) => s.setCameraTarget);
  const cameraAction   = useSceneStore((s) => s.cameraAction);
  const autoCamera     = useUIStore((s) => s.autoCameraEnabled);

  useFrame(({ camera, controls, clock, delta }) => {
    let orbitTarget: THREE.Vector3 | null =
      controls && (controls as any).target ? (controls as any).target : null;

    // Guard against NaN in OrbitControls target
    if (orbitTarget && (isNaN(orbitTarget.x) || isNaN(orbitTarget.y) || isNaN(orbitTarget.z))) {
      orbitTarget.set(0, 0, 0);
    }

    // ── Fly-to ──────────────────────────────────────────────────────────────
    if (cameraTarget) {
      const dest = new THREE.Vector3(...cameraTarget);
      const currentOffset = camera.position.clone().sub(orbitTarget ?? new THREE.Vector3());
      const dist = Math.max(currentOffset.length(), 40);
      const camDest = dest.clone().add(new THREE.Vector3(0, dist * 0.3, dist));
      camera.position.lerp(camDest, 0.06);
      orbitTarget?.lerp(dest, 0.06);
      if (camera.position.distanceTo(camDest) < 2.0) {
        setCameraTarget(null);
        targetRef.current = null;
      }
      (controls as any)?.update?.();
      return;
    }

    // ── Manual button actions ────────────────────────────────────────────────
    if (cameraAction) {
      const speed = SPEED * delta * 60;

      if (cameraAction === "reset") {
        camera.position.lerp(new THREE.Vector3(0, 0, 120), 0.07);
        orbitTarget?.lerp(new THREE.Vector3(0, 0, 0), 0.07);
        (controls as any)?.update?.();
        return;
      }

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const delta3 = new THREE.Vector3();

      switch (cameraAction) {
        case "move-left":      delta3.addScaledVector(right,   -speed); break;
        case "move-right":     delta3.addScaledVector(right,    speed); break;
        case "move-up":        delta3.addScaledVector(up,       speed); break;
        case "move-down":      delta3.addScaledVector(up,      -speed); break;
        case "move-forward":   delta3.addScaledVector(forward,  speed); break;
        case "move-backward":  delta3.addScaledVector(forward, -speed); break;
        case "zoom-in":        delta3.addScaledVector(forward,  speed * 2); break;
        case "zoom-out":       delta3.addScaledVector(forward, -speed * 2); break;
      }

      camera.position.add(delta3);
      orbitTarget?.add(delta3);
      (controls as any)?.update?.();
      return;
    }

    // ── Auto drift animation ─────────────────────────────────────────────────
    if (!autoCamera) return;

    const t = clock.getElapsedTime();

    // Gentle orbit around current target
    const center = orbitTarget ?? new THREE.Vector3();
    const offset = camera.position.clone().sub(center);
    const dist = offset.length();
    if (dist < 0.1) return;

    // Slow horizontal rotation
    const rotSpeed = 0.12 * delta; // radians per second
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
    offset.applyQuaternion(qY);

    // Oscillate zoom in/out — gentle ±15% of current distance
    const zoomFactor = 1 + Math.sin(t * 0.18) * 0.005;
    offset.multiplyScalar(zoomFactor);

    camera.position.copy(center).add(offset);
    camera.lookAt(center);
    (controls as any)?.update?.();
  });

  return null;
}
