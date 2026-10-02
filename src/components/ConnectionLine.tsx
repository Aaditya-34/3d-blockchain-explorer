import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  index: number;
}

export function ConnectionLine({ start, end, index }: ConnectionLineProps) {
  const packetRef = useRef<THREE.Mesh>(null);

  // Animate a glowing data packet travelling along the connection line
  useFrame(({ clock }) => {
    if (packetRef.current) {
      // Loop from 0 to 1 with an offset per connection index
      const t = ((clock.getElapsedTime() * 0.8 + index * 0.25) % 1);
      
      const x = THREE.MathUtils.lerp(start[0], end[0], t);
      const y = THREE.MathUtils.lerp(start[1], end[1], t);
      const z = THREE.MathUtils.lerp(start[2], end[2], t);
      
      packetRef.current.position.set(x, y, z);
    }
  });

  return (
    <group>
      {/* Thin glowing light line between adjacent blocks */}
      <Line
        points={[start, end]}
        color="#38bdf8"
        lineWidth={1.8}
        transparent={true}
        opacity={0.65}
      />

      {/* Secondary faint outer glow line */}
      <Line
        points={[start, end]}
        color="#0284c7"
        lineWidth={3.5}
        transparent={true}
        opacity={0.25}
      />

      {/* Traveling data particle along the light line */}
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
