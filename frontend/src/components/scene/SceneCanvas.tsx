import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Preload, AdaptiveDpr } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { ErrorBoundary } from "react-error-boundary";
import { PointCloud } from "./PointCloud";
import { SearchPoint } from "./SearchPoint";
import { ConnectionLines } from "./ConnectionLines";
import { ClusterLabels } from "./ClusterLabels";
import { CameraController } from "./CameraController";
import { usePoints, useClusters } from "@/hooks/usePoints";
import { useUIStore } from "@/stores/uiStore";

function SceneFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-full items-center justify-center text-red-400 text-sm p-8 text-center">
      <div>
        <p className="font-semibold mb-1">3D scene failed to load</p>
        <p className="opacity-60">{error.message}</p>
      </div>
    </div>
  );
}

function SceneContents() {
  const activeCollection = useUIStore((s) => s.activeCollection);
  const { data: pointsData } = usePoints(activeCollection);
  const { data: clusters } = useClusters(activeCollection);

  const points = pointsData?.points ?? [];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[100, 100, 100]} intensity={0.8} />

      <Stars radius={200} depth={60} count={3000} factor={4} fade speed={0.5} />

      <PointCloud points={points} />
      <SearchPoint />
      <ConnectionLines />
      {clusters && <ClusterLabels clusters={clusters} />}

      <CameraController />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={300}
      />

      <AdaptiveDpr pixelated />

      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={1.2}
          blendFunction={BlendFunction.ADD}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

export function SceneCanvas() {
  return (
    <ErrorBoundary FallbackComponent={SceneFallback}>
      <Canvas
        camera={{ position: [0, 0, 120], fov: 60, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#050510" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#050510", 150, 500]} />
          <SceneContents />
          <Preload all />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}
