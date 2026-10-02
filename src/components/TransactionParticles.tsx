import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BlockData } from '../data/mockBlocks';
import { getBlockPosition } from '../utils/chainLayout';

interface TransactionParticlesProps {
  blocks: BlockData[];
  cinematicMode: boolean;
}

const MAX_FLYING = 120;
const MEMPOOL_COUNT = 45;
const TOTAL_INSTANCES = MAX_FLYING + MEMPOOL_COUNT;

// Reusable scratch objects to guarantee zero allocation in animation loop
const DUMMY = new THREE.Object3D();
const COLOR_CYAN = new THREE.Color('#38bdf8');
const COLOR_PINK = new THREE.Color('#ec4899');
const COLOR_WHITE = new THREE.Color('#ffffff');
const COLOR_PURPLE = new THREE.Color('#c084fc');
const COLOR_TEMP = new THREE.Color();

function createFlyingData() {
  return {
    startX: new Float32Array(MAX_FLYING),
    startY: new Float32Array(MAX_FLYING),
    startZ: new Float32Array(MAX_FLYING),
    targetX: new Float32Array(MAX_FLYING),
    targetY: new Float32Array(MAX_FLYING),
    targetZ: new Float32Array(MAX_FLYING),
    initialRadius: new Float32Array(MAX_FLYING),
    spiralOffset: new Float32Array(MAX_FLYING),
    dirX: new Float32Array(MAX_FLYING),
    dirZ: new Float32Array(MAX_FLYING),
    progress: new Float32Array(MAX_FLYING),
    speed: new Float32Array(MAX_FLYING),
    delay: new Float32Array(MAX_FLYING),
    arc: new Float32Array(MAX_FLYING),
    size: new Float32Array(MAX_FLYING),
    active: new Uint8Array(MAX_FLYING),
    colorType: new Uint8Array(MAX_FLYING),
  };
}

function createMempoolData() {
  const offsetX = new Float32Array(MEMPOOL_COUNT);
  const offsetY = new Float32Array(MEMPOOL_COUNT);
  const offsetZ = new Float32Array(MEMPOOL_COUNT);
  const speed = new Float32Array(MEMPOOL_COUNT);
  const phase = new Float32Array(MEMPOOL_COUNT);
  const radius = new Float32Array(MEMPOOL_COUNT);
  const size = new Float32Array(MEMPOOL_COUNT);
  const colorType = new Uint8Array(MEMPOOL_COUNT);

  // Deterministic golden spiral distribution around mempool center
  for (let i = 0; i < MEMPOOL_COUNT; i++) {
    const u = ((i + 1) * 0.61803398875) % 1;
    const v = ((i + 1) * 0.38196601125) % 1;
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 0.4 + ((i % 8) / 8) * 0.9;

    offsetX[i] = r * Math.sin(phi) * Math.cos(theta);
    offsetY[i] = r * Math.sin(phi) * Math.sin(theta);
    offsetZ[i] = r * Math.cos(phi);

    speed[i] = 0.7 + ((i % 5) / 5) * 1.1;
    phase[i] = ((i % 9) / 9) * Math.PI * 2;
    radius[i] = 0.25 + ((i % 4) / 4) * 0.35;
    size[i] = 0.08 + ((i % 6) / 6) * 0.05; // Slightly larger for better visibility
    colorType[i] = i % 3; // 0: cyan, 1: purple, 2: white
  }

  return { offsetX, offsetY, offsetZ, speed, phase, radius, size, colorType };
}

export function TransactionParticles({
  blocks,
  cinematicMode,
}: TransactionParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.Group>(null);
  const lastMintedNumberRef = useRef<number | null>(null);
  const isFirstMountRef = useRef(true);

  // Pre-allocated mutable buffers stored in refs
  const flyingDataRef = useRef(createFlyingData());
  const mempoolDataRef = useRef(createMempoolData());

  const activeBlocks = useMemo(
    () => blocks.filter((b) => !b.isExiting),
    [blocks]
  );
  const latestBlock = activeBlocks[activeBlocks.length - 1];

  // Calculate current positions of latest block and mempool cluster
  const totalActive = Math.max(1, activeBlocks.length);
  const [latestX, latestY, latestZ] = useMemo(
    () => getBlockPosition(totalActive - 1, totalActive),
    [totalActive]
  );

  const mempoolPos = useMemo(
    () => [latestX + 4.0, latestY + 1.2, latestZ] as [number, number, number],
    [latestX, latestY, latestZ]
  );

  // Trigger transaction particle fly-in when a new block is minted
  useEffect(() => {
    if (!latestBlock) return;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      lastMintedNumberRef.current = latestBlock.number;
      return;
    }

    if (latestBlock.number !== lastMintedNumberRef.current) {
      lastMintedNumberRef.current = latestBlock.number;

      // Particle count scaled with txCount: minimum 25, maximum 120
      const txCount = latestBlock.txCount || 80;
      const particleCount = Math.min(Math.max(25, Math.floor(txCount * 0.5)), MAX_FLYING);
      const [tx, ty, tz] = getBlockPosition(totalActive - 1, totalActive);
      const flying = flyingDataRef.current;
      const mempool = mempoolDataRef.current;

      const durationSpeed = cinematicMode ? 0.95 : 1.8;

      for (let i = 0; i < MAX_FLYING; i++) {
        if (i < particleCount) {
          flying.active[i] = 1;
          flying.progress[i] = 0;
          flying.targetX[i] = tx;
          flying.targetY[i] = ty;
          flying.targetZ[i] = tz;
          flying.speed[i] = (0.75 + ((i % 5) / 5) * 0.5) * durationSpeed;
          flying.delay[i] = cinematicMode ? ((i % 10) / 10) * 0.45 : 0;
          flying.arc[i] = ((i % 7) / 7 - 0.4) * 2.2;
          flying.size[i] = 0.085 + ((i % 6) / 6) * 0.055; // Noticeably larger, glowing particles
          flying.colorType[i] = i % 4; // 0: pink, 1: cyan, 2: white, 3: purple

          flying.spiralOffset[i] = (i / particleCount) * Math.PI * 2;
          flying.dirX[i] = i % 2 === 0 ? 1 : -1;
          flying.dirZ[i] = i % 3 === 0 ? 1 : -1;

          // ~40% of particles stream directly from the floating mempool cluster
          if (i % 5 < 2) {
            const mIdx = i % MEMPOOL_COUNT;
            flying.startX[i] = mempoolPos[0] + mempool.offsetX[mIdx];
            flying.startY[i] = mempoolPos[1] + mempool.offsetY[mIdx];
            flying.startZ[i] = mempoolPos[2] + mempool.offsetZ[mIdx];
            const dx = flying.startX[i] - tx;
            const dz = flying.startZ[i] - tz;
            flying.initialRadius[i] = Math.sqrt(dx * dx + dz * dz);
          } else {
            // Sphere around and above the newly forming block
            const r = 2.6 + ((i % 8) / 8) * 3.8;
            const theta = (i / particleCount) * Math.PI * 2 + ((i % 4) * 0.5);
            const phi = ((i % 6) / 6) * (Math.PI * 0.42) + 0.1; // Hemisphere above
            flying.startX[i] = tx + r * Math.sin(phi) * Math.cos(theta);
            flying.startY[i] = ty + 1.2 + r * Math.cos(phi);
            flying.startZ[i] = tz + r * Math.sin(phi) * Math.sin(theta);
            flying.initialRadius[i] = r;
          }
        } else {
          flying.active[i] = 0;
        }
      }
    }
  }, [latestBlock, totalActive, mempoolPos, cinematicMode]);

  // Set initial instance colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const flying = flyingDataRef.current;
    const mempool = mempoolDataRef.current;

    // Flying particles colors
    for (let i = 0; i < MAX_FLYING; i++) {
      const c = flying.colorType[i];
      if (c === 0) COLOR_TEMP.copy(COLOR_PINK);
      else if (c === 1) COLOR_TEMP.copy(COLOR_CYAN);
      else if (c === 2) COLOR_TEMP.copy(COLOR_WHITE);
      else COLOR_TEMP.copy(COLOR_PURPLE);
      mesh.setColorAt(i, COLOR_TEMP);
    }

    // Mempool particles colors
    for (let j = 0; j < MEMPOOL_COUNT; j++) {
      const idx = MAX_FLYING + j;
      const c = mempool.colorType[j];
      if (c === 0) COLOR_TEMP.copy(COLOR_CYAN);
      else if (c === 1) COLOR_TEMP.copy(COLOR_PURPLE);
      else COLOR_TEMP.copy(COLOR_WHITE);
      mesh.setColorAt(idx, COLOR_TEMP);
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, []);

  // Animation Loop: Zero object allocation, constant 60 FPS
  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();
    const flying = flyingDataRef.current;
    const mempool = mempoolDataRef.current;

    // 1. Update Flying Transaction Particles (Indices 0 to MAX_FLYING - 1)
    for (let i = 0; i < MAX_FLYING; i++) {
      if (flying.active[i] === 1) {
        if (flying.delay[i] > 0) {
          flying.delay[i] -= delta;
          DUMMY.scale.set(0, 0, 0);
          DUMMY.position.set(0, -999, 0);
          DUMMY.updateMatrix();
          mesh.setMatrixAt(i, DUMMY.matrix);
          continue;
        }

        flying.progress[i] += delta * flying.speed[i];
        const t = Math.min(1.0, flying.progress[i]);

        if (t >= 1.0) {
          // Arrived at block: fade out into the energy core
          flying.active[i] = 0;
          DUMMY.scale.set(0, 0, 0);
          DUMMY.position.set(0, -999, 0);
          DUMMY.updateMatrix();
          mesh.setMatrixAt(i, DUMMY.matrix);
        } else {
          // STAGE 1 MEMPOOL CONVERGE: Inward spiral trajectory towards target center
          const sx = flying.startX[i];
          const sy = flying.startY[i];
          const sz = flying.startZ[i];
          const tx = flying.targetX[i];
          const ty = flying.targetY[i];
          const tz = flying.targetZ[i];

          // Spiral rotation around vertical axis as it converges
          const remainingR = (1.0 - t) * flying.initialRadius[i];
          const spiralAngle = (1.0 - t) * Math.PI * 3.5 + flying.spiralOffset[i];

          const spiralX = tx + Math.cos(spiralAngle) * remainingR * flying.dirX[i];
          const spiralZ = tz + Math.sin(spiralAngle) * remainingR * flying.dirZ[i];

          // Blend from direct trajectory to spiral as it approaches
          const directX = THREE.MathUtils.lerp(sx, tx, t);
          const directZ = THREE.MathUtils.lerp(sz, tz, t);
          const blendSpiral = Math.sin(t * Math.PI);

          const curX = THREE.MathUtils.lerp(directX, spiralX, blendSpiral * 0.7);
          const curY = THREE.MathUtils.lerp(sy, ty, t) + Math.sin(t * Math.PI) * flying.arc[i];
          const curZ = THREE.MathUtils.lerp(directZ, spiralZ, blendSpiral * 0.7);

          // Scale fades down smoothly as it enters the energy core
          const scaleMult = Math.sin((1.0 - t) * Math.PI * 0.5);
          const currentSize = flying.size[i] * scaleMult;

          DUMMY.position.set(curX, curY, curZ);
          DUMMY.scale.set(currentSize, currentSize, currentSize);
          DUMMY.rotation.x = time * 3.5 + i;
          DUMMY.rotation.y = time * 4.0 + i;
          DUMMY.updateMatrix();
          mesh.setMatrixAt(i, DUMMY.matrix);
        }
      } else {
        // Inactive flying particle: hide
        DUMMY.scale.set(0, 0, 0);
        DUMMY.position.set(0, -999, 0);
        DUMMY.updateMatrix();
        mesh.setMatrixAt(i, DUMMY.matrix);
      }
    }

    // 2. Update Mempool Floating Cluster Particles (Indices MAX_FLYING to TOTAL_INSTANCES - 1)
    const mBaseX = mempoolPos[0];
    const mBaseY = mempoolPos[1];
    const mBaseZ = mempoolPos[2];

    for (let j = 0; j < MEMPOOL_COUNT; j++) {
      const idx = MAX_FLYING + j;
      const spd = mempool.speed[j];
      const ph = mempool.phase[j];
      const rad = mempool.radius[j];

      // Organic hovering drift around mempool center
      const driftX = Math.sin(time * spd + ph) * rad;
      const driftY = Math.cos(time * spd * 0.8 + ph) * (rad * 0.7);
      const driftZ = Math.sin(time * spd * 1.2 + ph * 1.5) * (rad * 0.8);

      const px = mBaseX + mempool.offsetX[j] + driftX;
      const py = mBaseY + mempool.offsetY[j] + driftY;
      const pz = mBaseZ + mempool.offsetZ[j] + driftZ;

      // Subtle breathing scale
      const breathe = 1.0 + Math.sin(time * 2.2 + ph) * 0.28;
      const curSize = mempool.size[j] * breathe;

      DUMMY.position.set(px, py, pz);
      DUMMY.scale.set(curSize, curSize, curSize);
      DUMMY.rotation.x = time * 1.4 + j;
      DUMMY.rotation.y = time * 1.7 + j;
      DUMMY.updateMatrix();
      mesh.setMatrixAt(idx, DUMMY.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Rotate subtle mempool visual halo
    if (haloRef.current) {
      haloRef.current.position.set(mBaseX, mBaseY, mBaseZ);
      haloRef.current.rotation.y = time * 0.35;
      haloRef.current.rotation.z = Math.sin(time * 0.5) * 0.15;
    }
  });

  return (
    <group>
      {/* High performance Single InstancedMesh for all particles */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, TOTAL_INSTANCES]}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          transparent={true}
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Floating Mempool HUD Indicators & Cyber Rings */}
      <group ref={haloRef} position={mempoolPos}>
        {/* Outer Orbiting Cyber Rings */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[1.5, 1.55, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent={true}
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <ringGeometry args={[1.65, 1.68, 32]} />
          <meshBasicMaterial
            color="#ec4899"
            transparent={true}
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Ambient Mempool Core Light */}
        <pointLight
          color="#38bdf8"
          intensity={1.8}
          distance={6}
          decay={2}
        />

        {/* Floating 3D Mempool Label */}
        <Text
          position={[0, 1.9, 0]}
          fontSize={0.24}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#02040a"
          letterSpacing={0.08}
        >
          MEMPOOL
        </Text>
        <Text
          position={[0, 1.62, 0]}
          fontSize={0.16}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#02040a"
        >
          {`${latestBlock ? latestBlock.txCount : 0} Pending TXs`}
        </Text>
      </group>
    </group>
  );
}
