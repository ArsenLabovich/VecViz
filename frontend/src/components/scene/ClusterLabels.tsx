import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ClusterInfo } from "@/types/point";

const LABEL_VISIBLE_DISTANCE = 120;

interface Props {
  clusters: ClusterInfo[];
}

export function ClusterLabels({ clusters }: Props) {
  return (
    <>
      {clusters.map((c) => (
        <ClusterLabel key={c.cluster_id} cluster={c} />
      ))}
    </>
  );
}

function ClusterLabel({ cluster }: { cluster: ClusterInfo }) {
  const ref = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const dist = camera.position.distanceTo(g.position);
    g.visible = dist < LABEL_VISIBLE_DISTANCE;
  });

  if (!cluster.label) return null;

  return (
    <group
      ref={ref}
      position={[cluster.centroid.x, cluster.centroid.y + 3, cluster.centroid.z]}
    >
      <Html center distanceFactor={40} occlude>
        <div
          className="pointer-events-none select-none whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
          style={{
            background: `${cluster.color}33`,
            border: `1px solid ${cluster.color}88`,
            color: cluster.color,
          }}
        >
          {cluster.label}
        </div>
      </Html>
    </group>
  );
}
