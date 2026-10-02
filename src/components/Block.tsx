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
}

export function Block({
  block,
  position,
  index,
  isSelected,
  onSelect,
}: BlockProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const [hovered, setHovered] = useState(false);

  const isLatest = block.status === 'latest';
  const primaryGlow = isLatest ? '#ec4899' : '#00e5ff';
  const edgeColor = isLatest ? '#f43f5e' : '#38bdf8';
  const baseColor = isLatest ? '#2b0922' : '#041628';

  // Initial GSAP Entrance Animation
  useEffect(() => {
    if (!groupRef.current) return;

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
      { y: position[1] - 4 },
      {
        y: position[1],
        duration: 0.9,
        delay: index * 0.08,
        ease: 'power3.out',
      }
    );
  }, [index, position]);

  // GSAP Hover and Selection Transitions
  useEffect(() => {
    if (!groupRef.current) return;

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
      const targetEmissiveIntensity = isSelected ? 0.9 : hovered ? 0.7 : 0.4;
      gsap.to(materialRef.current, {
        emissiveIntensity: targetEmissiveIntensity,
        duration: 0.3,
      });
    }
  }, [hovered, isSelected, position]);

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
        {`#${block.number}`}
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
