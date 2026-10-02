import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';
import gsap from 'gsap';
import { StarsBackground } from './StarsBackground';
import { Blockchain } from './Blockchain';
import { Controls } from './Controls';
import { TransactionParticles } from './TransactionParticles';
import type { BlockData } from '../data/mockBlocks';

interface SceneProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData | null) => void;
  cinematicMode: boolean;
  formingStartTime: number;
  formingBlockNumber: number | null;
  followLatestBlock: boolean;
  onDisableFollowLatest: () => void;
}

export function Scene({
  blocks,
  selectedBlock,
  onSelectBlock,
  cinematicMode,
  formingStartTime,
  formingBlockNumber,
  followLatestBlock,
  onDisableFollowLatest,
}: SceneProps) {
  const bloomRef = useRef<BloomEffect>(null);
  const [composerEnabled, setComposerEnabled] = useState(false);

  // STAGE 4: Impact Bloom Flash
  const handleImpact = () => {
    setComposerEnabled(true);
    if (bloomRef.current) {
      bloomRef.current.intensity = 1.6;
      gsap.killTweensOf(bloomRef.current);
      gsap.to(bloomRef.current, {
        intensity: 0,
        duration: 0.85,
        ease: 'power2.out',
        onComplete: () => {
          setComposerEnabled(false);
        },
      });
    } else {
      setTimeout(() => setComposerEnabled(false), 900);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 4, 25], fov: 45 }}
        gl={{ antialias: true }}
        onPointerMissed={() => onSelectBlock(null)}
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
        <pointLight position={[-24, 4, 6]} color="#00f5ff" intensity={2.2} distance={35} />
        <pointLight position={[24, 4, 6]} color="#f43f5e" intensity={2.2} distance={35} />

        {/* Subtle stars */}
        <StarsBackground />

        {/* Dynamic Horizontal Blockchain */}
        <Blockchain
          blocks={blocks}
          selectedBlock={selectedBlock}
          onSelectBlock={onSelectBlock}
          cinematicMode={cinematicMode}
          formingStartTime={formingStartTime}
          formingBlockNumber={formingBlockNumber}
          onImpact={handleImpact}
        />

        {/* Live Transaction Particles & Mempool Cluster */}
        <TransactionParticles
          blocks={blocks}
          cinematicMode={cinematicMode}
        />

        {/* OrbitControls (User input, block click fly-to, Escape return, Follow latest block) */}
        <Controls
          selectedBlock={selectedBlock}
          blocks={blocks}
          followLatestBlock={followLatestBlock}
          onDisableFollowLatest={onDisableFollowLatest}
        />

        {/* Stage 4: Short Impact Bloom Flash (enabled only while the effect plays) */}
        <EffectComposer enabled={composerEnabled}>
          <Bloom
            ref={bloomRef}
            intensity={1.6}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.8}
            mipmapBlur={false}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
