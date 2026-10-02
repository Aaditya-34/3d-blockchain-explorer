import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type * as THREE from 'three';

export function StarsBackground() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015;
      groupRef.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Subtle deep space stars */}
      <Stars
        radius={90}
        depth={60}
        count={3500}
        factor={3}
        saturation={0}
        fade={true}
        speed={0.8}
      />
      {/* Distant bright cosmic points */}
      <Stars
        radius={140}
        depth={40}
        count={800}
        factor={4.5}
        saturation={1}
        fade={true}
        speed={0.4}
      />
    </group>
  );
}
