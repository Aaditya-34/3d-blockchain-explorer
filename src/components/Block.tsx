import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Text } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import type { BlockData } from '../data/mockBlocks';

interface BlockProps {
  block: BlockData;
  position: [number, number, number];
  index: number;
  isSelected: boolean;
  onSelect: (block: BlockData) => void;
  cinematicMode?: boolean;
}

export function Block({
  block,
  position,
  index,
  isSelected,
  onSelect,
  cinematicMode = true,
}: BlockProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  const isMountedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const isLatest = block.status === 'latest';
  const primaryGlow = isLatest ? '#ec4899' : '#00e5ff';
  const edgeColor = isLatest ? '#f43f5e' : '#38bdf8';
  const baseColor = isLatest ? '#2b0922' : '#041628';

  const posX = position[0];
  const posY = position[1];
  const posZ = position[2];
  const blockNumber = block.number;
  const isExiting = block.isExiting;
  const isNewLiveMint = isLatest && blockNumber > 21849199;

  // Stage 5: Block number counts up during link draw for new blocks
  const [displayNumber, setDisplayNumber] = useState<number>(() =>
    isNewLiveMint ? blockNumber - 8 : blockNumber
  );

  // Mount Animation: Staggered for initial blocks, cinematic solidify for newly minted blocks
  useEffect(() => {
    if (!groupRef.current) return;
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    // Newly minted block arriving live
    if (isNewLiveMint) {
      groupRef.current.position.set(posX, posY, posZ);
      // Keep hidden until Stage 3 Solidify
      groupRef.current.scale.set(0, 0, 0);

      const solidifyDelay = cinematicMode ? 1.75 : 0.35;
      const countDelay = cinematicMode ? 2.05 : 0.45;

      // STAGE 3: SOLIDIFY - scale in from core outward with slight overshoot bounce
      gsap.fromTo(
        groupRef.current.scale,
        { x: 0.05, y: 0.05, z: 0.05 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.65,
          delay: solidifyDelay,
          ease: 'back.out(2.2)', // slight overshoot bounce
        }
      );

      // Emissive flash
      if (materialRef.current) {
        gsap.fromTo(
          materialRef.current,
          { opacity: 0, emissiveIntensity: 3.5 },
          {
            opacity: 0.88,
            emissiveIntensity: 0.65,
            duration: 0.85,
            delay: solidifyDelay,
            ease: 'power2.out',
          }
        );
      }

      if (pointLightRef.current) {
        gsap.fromTo(
          pointLightRef.current,
          { intensity: 7.2 },
          {
            intensity: 2.2,
            duration: 0.85,
            delay: solidifyDelay,
            ease: 'power2.out',
          }
        );
      }

      // STAGE 5: LINK - Block number counts up as link draws
      const countObj = { val: blockNumber - 8 };
      gsap.to(countObj, {
        val: blockNumber,
        duration: 0.7,
        delay: countDelay,
        ease: 'power1.out',
        onUpdate: () => {
          setDisplayNumber(Math.round(countObj.val));
        },
        onComplete: () => {
          setDisplayNumber(blockNumber);
        },
      });
    } else {
      // Initial page load entrance
      gsap.fromTo(
        groupRef.current.scale,
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.9,
          delay: index * 0.08,
          ease: 'back.out(1.6)',
        }
      );

      gsap.fromTo(
        groupRef.current.position,
        { y: posY - 4 },
        {
          y: posY,
          duration: 0.9,
          delay: index * 0.08,
          ease: 'power3.out',
        }
      );
    }
  }, [blockNumber, index, isLatest, isNewLiveMint, posX, posY, posZ, cinematicMode]);

  // Smooth position shift when chain moves
  useEffect(() => {
    if (!groupRef.current || !isMountedRef.current) return;

    gsap.to(groupRef.current.position, {
      x: posX,
      duration: 0.7,
      ease: 'power2.out',
    });
  }, [posX]);

  // Fade out and shrink when block is exiting the 15-block limit
  useEffect(() => {
    if (!isExiting || !groupRef.current) return;

    gsap.to(groupRef.current.scale, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      duration: 0.7,
      ease: 'power2.in',
    });

    gsap.to(groupRef.current.position, {
      x: posX - 2.5,
      duration: 0.7,
      ease: 'power2.in',
    });

    if (materialRef.current) {
      gsap.to(materialRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.in',
      });
    }
  }, [isExiting, posX]);

  // GSAP Hover and Selection Transitions
  useEffect(() => {
    if (!groupRef.current || block.isExiting) return;

    const targetY = isSelected ? position[1] + 0.5 : hovered ? position[1] + 0.3 : position[1];
    const targetScale = isSelected ? 1.15 : hovered ? 1.08 : 1.0;

    gsap.to(groupRef.current.position, {
      y: targetY,
      duration: 0.4,
      ease: 'power2.out',
    });

    gsap.to(groupRef.current.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: 0.4,
      ease: 'power2.out',
    });

    if (materialRef.current) {
      const targetEmissiveIntensity = isSelected ? 0.9 : hovered ? 0.7 : (isLatest ? 0.65 : 0.4);
      gsap.to(materialRef.current, {
        emissiveIntensity: targetEmissiveIntensity,
        duration: 0.3,
      });
    }
  }, [hovered, isSelected, position, block.isExiting, isLatest]);

  // Subtle continuous rotation for the cryptographic inner core
  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.8;
      coreRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Outer Glowing Block */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial
          ref={materialRef}
          color={baseColor}
          emissive={primaryGlow}
          emissiveIntensity={isSelected ? 0.9 : 0.4}
          roughness={0.2}
          metalness={0.8}
          transparent={true}
          opacity={0.88}
        />
        {/* Crisp Cyber Wireframe Edges */}
        <Edges
          linewidth={2}
          threshold={15}
          color={isSelected ? '#ffffff' : edgeColor}
        />
      </mesh>

      {/* Internal Cryptographic Core (Rotating Octahedron) */}
      <mesh ref={coreRef} scale={[0.5, 0.5, 0.5]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color={primaryGlow}
          wireframe={true}
          transparent={true}
          opacity={0.7}
        />
      </mesh>

      {/* Point Light emitted from within the cube */}
      <pointLight
        ref={pointLightRef}
        color={primaryGlow}
        intensity={isSelected ? 3.5 : hovered ? 2.5 : 1.2}
        distance={4.5}
        decay={2}
      />

      {/* Floating 3D Block Height Label Above */}
      <Text
        position={[0, 1.25, 0]}
        fontSize={0.28}
        color={isSelected ? '#ffffff' : '#93c5fd'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#030712"
      >
        {`#${displayNumber}`}
      </Text>

      {/* Front Face Mini Badge */}
      <Text
        position={[0, 0, 0.82]}
        fontSize={0.22}
        color={isLatest ? '#f472b6' : '#67e8f9'}
        anchorX="center"
        anchorY="middle"
      >
        {`${block.txCount} TXs`}
      </Text>
    </group>
  );
}
