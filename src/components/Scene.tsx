import { Canvas } from '@react-three/fiber';
import { StarsBackground } from './StarsBackground';
import { Blockchain } from './Blockchain';
import { Controls } from './Controls';
import type { BlockData } from '../data/mockBlocks';

interface SceneProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData) => void;
}

export function Scene({ blocks, selectedBlock, onSelectBlock }: SceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 4, 25], fov: 45 }}
        gl={{ antialias: true }}
        onPointerMissed={() => onSelectBlock(null as unknown as BlockData)}
      >
        {/* Deep dark space background */}
        <color attach="background" args={['#02040a']} />
        
        {/* Subtle space fog for depth perception */}
        <fog attach="fog" args={['#02040a', 25, 85]} />

        {/* Space lighting */}
        <ambientLight intensity={0.5} color="#e0e7ff" />
        <directionalLight position={[10, 15, 10]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} color="#38bdf8" />

        {/* Ambient point lights accenting the chain ends */}
        <pointLight position={[-16, 4, 6]} color="#00f5ff" intensity={2} distance={25} />
        <pointLight position={[16, 4, 6]} color="#f43f5e" intensity={2} distance={25} />

        {/* Subtle stars */}
        <StarsBackground />

        {/* 10 horizontal blocks chain */}
        <Blockchain
          blocks={blocks}
          selectedBlock={selectedBlock}
          onSelectBlock={onSelectBlock}
        />

        {/* Smooth damping OrbitControls */}
        <Controls />
      </Canvas>
    </div>
  );
}
