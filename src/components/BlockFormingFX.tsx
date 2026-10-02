import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BlockFormingFXProps {
  position: [number, number, number];
  formingBlockNumber: number | null;
  cinematicMode: boolean;
  onImpact: () => void;
}

const SPARKS_COUNT = 24;
const DUMMY = new THREE.Object3D();
const EDGES_COUNT = 12;

// Edge orientations and midpoints relative to block center (cube size 1.6)
// Half-size H = 0.8
const H = 0.8;
const EDGE_CONFIGS: Array<{
  pos: [number, number, number];
  rot: [number, number, number];
}> = [
  // 4 Bottom edges (horizontal)
  { pos: [0, -H, -H], rot: [0, 0, Math.PI / 2] }, // along X
  { pos: [H, -H, 0], rot: [Math.PI / 2, 0, 0] },  // along Z
  { pos: [0, -H, H], rot: [0, 0, Math.PI / 2] },  // along X
  { pos: [-H, -H, 0], rot: [Math.PI / 2, 0, 0] }, // along Z

  // 4 Vertical pillar edges (along Y)
  { pos: [-H, 0, -H], rot: [0, 0, 0] },
  { pos: [H, 0, -H], rot: [0, 0, 0] },
  { pos: [H, 0, H], rot: [0, 0, 0] },
  { pos: [-H, 0, H], rot: [0, 0, 0] },

  // 4 Top edges (horizontal)
  { pos: [0, H, -H], rot: [0, 0, Math.PI / 2] },  // along X
  { pos: [H, H, 0], rot: [Math.PI / 2, 0, 0] },   // along Z
  { pos: [0, H, H], rot: [0, 0, Math.PI / 2] },   // along X
  { pos: [-H, H, 0], rot: [Math.PI / 2, 0, 0] },  // along Z
];

function createSparksData() {
  const vx = new Float32Array(SPARKS_COUNT);
  const vy = new Float32Array(SPARKS_COUNT);
  const vz = new Float32Array(SPARKS_COUNT);
  const size = new Float32Array(SPARKS_COUNT);

  for (let i = 0; i < SPARKS_COUNT; i++) {
    const theta = (i / SPARKS_COUNT) * Math.PI * 2 + (i % 3) * 0.3;
    const phi = ((i % 5) / 5) * Math.PI * 0.6 + 0.2;
    const speed = 2.2 + ((i % 4) / 4) * 2.0;

    vx[i] = Math.sin(phi) * Math.cos(theta) * speed;
    vy[i] = Math.cos(phi) * speed * 0.9 + 0.5;
    vz[i] = Math.sin(phi) * Math.sin(theta) * speed;
    size[i] = 0.05 + ((i % 3) / 3) * 0.04;
  }
  return { vx, vy, vz, size };
}

export function BlockFormingFX({
  position,
  formingBlockNumber,
  cinematicMode,
  onImpact,
}: BlockFormingFXProps) {
  const edgesMeshRef = useRef<THREE.InstancedMesh>(null);
  const sparksMeshRef = useRef<THREE.InstancedMesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwaveMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const startTimeRef = useRef<number>(0);
  const lastFormingNumberRef = useRef<number | null>(null);
  const hasTriggeredImpactRef = useRef<boolean>(false);
  const sparksDataRef = useRef(createSparksData());

  // Detect newly forming block and reset sequence timer
  useEffect(() => {
    if (formingBlockNumber && formingBlockNumber !== lastFormingNumberRef.current) {
      lastFormingNumberRef.current = formingBlockNumber;
      startTimeRef.current = performance.now();
      hasTriggeredImpactRef.current = false;
    }
  }, [formingBlockNumber]);

  useFrame(() => {
    if (!startTimeRef.current) return;

    const elapsedMs = performance.now() - startTimeRef.current;
    const totalDuration = cinematicMode ? 3200 : 900;

    if (elapsedMs > totalDuration + 200) {
      // Hide all effect meshes when sequence completes
      if (coreRef.current) coreRef.current.scale.set(0, 0, 0);
      if (shockwaveRef.current) shockwaveRef.current.scale.set(0, 0, 0);
      if (shockwaveMatRef.current) shockwaveMatRef.current.opacity = 0;

      if (edgesMeshRef.current) {
        for (let i = 0; i < EDGES_COUNT; i++) {
          DUMMY.scale.set(0, 0, 0);
          DUMMY.position.set(0, -999, 0);
          DUMMY.updateMatrix();
          edgesMeshRef.current.setMatrixAt(i, DUMMY.matrix);
        }
        edgesMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      if (sparksMeshRef.current) {
        for (let s = 0; s < SPARKS_COUNT; s++) {
          DUMMY.scale.set(0, 0, 0);
          DUMMY.position.set(0, -999, 0);
          DUMMY.updateMatrix();
          sparksMeshRef.current.setMatrixAt(s, DUMMY.matrix);
        }
        sparksMeshRef.current.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    const t = elapsedMs / 1000; // time in seconds
    const [bx, by, bz] = position;

    // Stage Timings (Cinematic mode: ~3.0s, Fast mode: ~0.8s)
    const tSkeletonStart = cinematicMode ? 0.85 : 0.05;
    const tSkeletonEnd = cinematicMode ? 1.75 : 0.4;
    const tImpact = cinematicMode ? 1.8 : 0.45;
    const tImpactEnd = cinematicMode ? 2.6 : 0.8;

    // ==========================================
    // STAGE 1: Pulsing Energy Core at Center
    // ==========================================
    if (coreRef.current && coreMatRef.current) {
      if (t < tImpact) {
        coreRef.current.position.set(bx, by, bz);
        const growProgress = Math.min(1.0, t / (tSkeletonStart * 0.8));
        const pulse = 1.0 + Math.sin(t * 18.0) * 0.3;
        const coreScale = growProgress * 0.55 * pulse;
        coreRef.current.scale.set(coreScale, coreScale, coreScale);
        coreRef.current.rotation.x = t * 3.0;
        coreRef.current.rotation.y = t * 4.0;
        coreMatRef.current.opacity = 0.95;
      } else {
        // Core merges into the solid cube
        const fadeP = Math.min(1.0, (t - tImpact) / 0.35);
        const collapseScale = (1.0 - fadeP) * 0.55;
        coreRef.current.scale.set(collapseScale, collapseScale, collapseScale);
        coreMatRef.current.opacity = (1.0 - fadeP) * 0.95;
      }
    }

    // ==========================================
    // STAGE 2: 12 Cube Skeleton Edges Drawing In
    // ==========================================
    const edgesMesh = edgesMeshRef.current;
    if (edgesMesh) {
      if (t >= tSkeletonStart && t < tImpact + 0.4) {
        const skeletonProgress = Math.min(
          1.0,
          (t - tSkeletonStart) / (tSkeletonEnd - tSkeletonStart)
        );

        for (let i = 0; i < EDGES_COUNT; i++) {
          const edgeStart = i / EDGES_COUNT;
          const edgeEnd = (i + 1) / EDGES_COUNT;
          const edgeProgress = Math.max(
            0,
            Math.min(1.0, (skeletonProgress - edgeStart) / (edgeEnd - edgeStart))
          );

          const cfg = EDGE_CONFIGS[i];
          DUMMY.position.set(
            bx + cfg.pos[0],
            by + cfg.pos[1],
            bz + cfg.pos[2]
          );
          DUMMY.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

          if (edgeProgress > 0) {
            // Draw length from 0 to 1.6
            DUMMY.scale.set(1.0, edgeProgress, 1.0);
          } else {
            DUMMY.scale.set(0, 0, 0);
          }

          DUMMY.updateMatrix();
          edgesMesh.setMatrixAt(i, DUMMY.matrix);
        }
        edgesMesh.instanceMatrix.needsUpdate = true;
      } else if (t >= tImpact + 0.4) {
        // Hide skeleton after cube has solidified
        for (let i = 0; i < EDGES_COUNT; i++) {
          DUMMY.scale.set(0, 0, 0);
          DUMMY.position.set(0, -999, 0);
          DUMMY.updateMatrix();
          edgesMesh.setMatrixAt(i, DUMMY.matrix);
        }
        edgesMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // ==========================================
    // STAGE 4: Impact Bloom Flash, Shockwave & Sparks
    // ==========================================
    if (t >= tImpact && !hasTriggeredImpactRef.current) {
      hasTriggeredImpactRef.current = true;
      onImpact();
    }

    // Ground plane shockwave ring
    if (shockwaveRef.current && shockwaveMatRef.current) {
      if (t >= tImpact && t < tImpactEnd) {
        const impactP = (t - tImpact) / (tImpactEnd - tImpact);
        // Expand ring outward
        const shockRadius = 0.5 + impactP * 4.2;
        shockwaveRef.current.position.set(bx, by - 1.25, bz);
        shockwaveRef.current.scale.set(shockRadius, shockRadius, shockRadius);
        shockwaveMatRef.current.opacity = Math.sin((1.0 - impactP) * Math.PI * 0.5) * 0.85;
      } else {
        shockwaveRef.current.scale.set(0, 0, 0);
        shockwaveMatRef.current.opacity = 0;
      }
    }

    // Radial Sparks Burst
    const sparksMesh = sparksMeshRef.current;
    if (sparksMesh) {
      if (t >= tImpact && t < tImpactEnd) {
        const sparkT = (t - tImpact) / (tImpactEnd - tImpact);
        const sparks = sparksDataRef.current;

        for (let s = 0; s < SPARKS_COUNT; s++) {
          const spProgress = sparkT;
          const px = bx + sparks.vx[s] * spProgress;
          const py = by + sparks.vy[s] * spProgress - 1.2 * spProgress * spProgress;
          const pz = bz + sparks.vz[s] * spProgress;

          const sparkScale = (1.0 - spProgress) * sparks.size[s];
          DUMMY.position.set(px, py, pz);
          DUMMY.scale.set(sparkScale, sparkScale, sparkScale);
          DUMMY.rotation.x = t * 6.0 + s;
          DUMMY.rotation.y = t * 8.0 + s;
          DUMMY.updateMatrix();
          sparksMesh.setMatrixAt(s, DUMMY.matrix);
        }
        sparksMesh.instanceMatrix.needsUpdate = true;
      } else {
        for (let s = 0; s < SPARKS_COUNT; s++) {
          DUMMY.scale.set(0, 0, 0);
          DUMMY.position.set(0, -999, 0);
          DUMMY.updateMatrix();
          sparksMesh.setMatrixAt(s, DUMMY.matrix);
        }
        sparksMesh.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Stage 1: Central Pulsing Cryptographic Energy Core */}
      <mesh ref={coreRef} scale={[0, 0, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial
          ref={coreMatRef}
          color="#f43f5e"
          wireframe={true}
          transparent={true}
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Stage 2: 12 Cube Wireframe Edges Drawing in Sequence */}
      <instancedMesh
        ref={edgesMeshRef}
        args={[undefined, undefined, EDGES_COUNT]}
      >
        <boxGeometry args={[0.025, 1.6, 0.025]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Stage 4: Ground Plane Shockwave Ring */}
      <mesh
        ref={shockwaveRef}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0, 0, 0]}
      >
        <ringGeometry args={[0.85, 1.05, 48]} />
        <meshBasicMaterial
          ref={shockwaveMatRef}
          color="#00f5ff"
          transparent={true}
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Stage 4: Burst of Impact Sparks */}
      <instancedMesh
        ref={sparksMeshRef}
        args={[undefined, undefined, SPARKS_COUNT]}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}
