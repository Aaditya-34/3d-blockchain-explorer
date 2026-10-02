import { OrbitControls } from '@react-three/drei';

export function Controls() {
  return (
    <OrbitControls
      makeDefault
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      panSpeed={0.8}
      minDistance={4}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2 + 0.25}
      minPolarAngle={Math.PI / 6}
    />
  );
}
