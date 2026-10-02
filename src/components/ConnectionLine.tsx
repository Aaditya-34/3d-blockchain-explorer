import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  index: number;
  isNewLink?: boolean;
  cinematicMode?: boolean;
  formingStartTime?: number;
}

export function ConnectionLine({
  start,
  end,
  index,
  isNewLink = false,
  cinematicMode = true,
  formingStartTime = 0,
}: ConnectionLineProps) {
  const packetRef = useRef<THREE.Mesh>(null);
  const lineGroupRef = useRef<THREE.Group>(null);
  const drawMeshRef = useRef<THREE.Mesh>(null);

  // Animate a glowing data packet travelling along the connection line
  useFrame(({ clock }) => {
    let linkProgress = 1.0;

    if (isNewLink && formingStartTime) {
      const elapsed = (performance.now() - formingStartTime) / 1000;
      const tStart = cinematicMode ? 2.1 : 0.4;
      const tEnd = cinematicMode ? 2.8 : 0.7;

      if (elapsed < tStart) {
        // Line has not drawn yet
        if (lineGroupRef.current) lineGroupRef.current.visible = false;
        if (packetRef.current) packetRef.current.scale.set(0, 0, 0);
        if (drawMeshRef.current) drawMeshRef.current.scale.set(0, 0, 0);
        return;
      } else if (elapsed < tEnd) {
        // Drawing in progress
        linkProgress = Math.min(1.0, (elapsed - tStart) / (tEnd - tStart));
        if (lineGroupRef.current) lineGroupRef.current.visible = false;

        // Animate dynamic drawing beam
        if (drawMeshRef.current) {
          drawMeshRef.current.visible = true;
          const fullDist = end[0] - start[0];
          const curDist = fullDist * linkProgress;
          drawMeshRef.current.position.set(start[0] + curDist / 2, start[1], start[2]);
          drawMeshRef.current.scale.set(curDist, 1, 1);
        }

        // Fast data packet at the head of the drawing beam
        if (packetRef.current) {
          packetRef.current.scale.set(1.6, 1.6, 1.6);
          packetRef.current.position.set(start[0] + (end[0] - start[0]) * linkProgress, start[1], start[2]);
        }
        return;
      } else {
        // Drawing complete: reveal full standard line
        if (lineGroupRef.current) lineGroupRef.current.visible = true;
        if (drawMeshRef.current) drawMeshRef.current.visible = false;
      }
    } else {
      if (lineGroupRef.current) lineGroupRef.current.visible = true;
      if (drawMeshRef.current) drawMeshRef.current.visible = false;
    }

    // Ambient packet cycling along established link
    if (packetRef.current) {
      packetRef.current.scale.set(1, 1, 1);
      const t = ((clock.getElapsedTime() * 0.8 + index * 0.25) % 1);
      const x = THREE.MathUtils.lerp(start[0], end[0], t);
      const y = THREE.MathUtils.lerp(start[1], end[1], t);
      const z = THREE.MathUtils.lerp(start[2], end[2], t);
      packetRef.current.position.set(x, y, z);
    }
  });

  return (
    <group>
      {/* Permanent lines after connection is established */}
      <group ref={lineGroupRef}>
        <Line
          points={[start, end]}
          color="#38bdf8"
          lineWidth={1.8}
          transparent={true}
          opacity={0.65}
        />
        <Line
          points={[start, end]}
          color="#0284c7"
          lineWidth={3.5}
          transparent={true}
          opacity={0.25}
        />
      </group>

      {/* Dynamic expanding laser line during drawing stage */}
      <mesh ref={drawMeshRef} visible={false}>
        <boxGeometry args={[1, 0.04, 0.04]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Traveling data particle along the light line */}
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
