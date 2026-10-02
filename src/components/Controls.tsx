import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import type { BlockData } from '../data/mockBlocks';
import { getBlockPosition } from '../utils/chainLayout';

interface ControlsProps {
  selectedBlock: BlockData | null;
  blocks: BlockData[];
  followLatestBlock: boolean;
  onDisableFollowLatest: () => void;
}

export function Controls({
  selectedBlock,
  blocks,
  followLatestBlock,
  onDisableFollowLatest,
}: ControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const isFirstRender = useRef(true);
  const prevBlockNumberRef = useRef<number | null>(null);
  const lastFollowedNumberRef = useRef<number | null>(null);

  // Auto-disable "Follow latest block" the moment the user interacts (drag, pan, or zoom)
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dom = gl.domElement;

    const handleUserInteraction = () => {
      if (followLatestBlock) {
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);
        onDisableFollowLatest();
      }
    };

    controls.addEventListener('start', handleUserInteraction);
    dom.addEventListener('pointerdown', handleUserInteraction);
    dom.addEventListener('wheel', handleUserInteraction, { passive: true });

    return () => {
      controls.removeEventListener('start', handleUserInteraction);
      dom.removeEventListener('pointerdown', handleUserInteraction);
      dom.removeEventListener('wheel', handleUserInteraction);
    };
  }, [followLatestBlock, onDisableFollowLatest, camera, gl]);

  // Reset follow tracker when toggled off
  useEffect(() => {
    if (!followLatestBlock) {
      lastFollowedNumberRef.current = null;
    }
  }, [followLatestBlock]);

  // Handle selected block inspection and overview return ONLY
  // No minting or chain shift state update is allowed to move the camera!
  useEffect(() => {
    // Avoid re-animating on mount when nothing is selected
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!selectedBlock) return;
    }

    const controls = controlsRef.current;
    if (!controls) return;

    const prevNumber = prevBlockNumberRef.current;
    const currentNumber = selectedBlock?.number ?? null;

    // If selectedBlock hasn't changed (e.g. minting, chain shift, age update), DO NOT move the camera!
    // The camera remains fixed in world space.
    if (prevNumber === currentNumber) {
      return;
    }

    prevBlockNumberRef.current = currentNumber;

    // Disable controls during camera transition animation to prevent fighting
    controls.enabled = false;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    if (selectedBlock) {
      // Find active position of selected block
      const activeBlocks = blocks.filter((b) => !b.isExiting);
      const idx = activeBlocks.findIndex((b) => b.number === selectedBlock.number);
      const targetIdx = idx !== -1 ? idx : activeBlocks.length - 1;
      const [bx, by, bz] = getBlockPosition(targetIdx, Math.max(1, activeBlocks.length));

      // Framing position: block slightly offset to the left of center for drawer balance
      const targetCamX = bx + 0.45;
      const targetCamY = by + 1.1;
      const targetCamZ = bz + 5.2;

      const targetLookX = bx + 0.45;
      const targetLookY = by + 0.35;
      const targetLookZ = bz;

      gsap.to(camera.position, {
        x: targetCamX,
        y: targetCamY,
        z: targetCamZ,
        duration: 1.15,
        ease: 'power3.inOut',
      });

      gsap.to(controls.target, {
        x: targetLookX,
        y: targetLookY,
        z: targetLookZ,
        duration: 1.15,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.lookAt(controls.target);
        },
        onComplete: () => {
          controls.update();
          controls.enabled = true;
        },
      });
    } else {
      // Smooth return to overview when drawer is closed or Escape is pressed
      gsap.to(camera.position, {
        x: 0,
        y: 4,
        z: 25,
        duration: 1.1,
        ease: 'power3.inOut',
      });

      gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.1,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.lookAt(controls.target);
        },
        onComplete: () => {
          controls.update();
          controls.enabled = true;
        },
      });
    }

    return () => {
      gsap.killTweensOf(camera.position);
      if (controls) gsap.killTweensOf(controls.target);
    };
  }, [selectedBlock, blocks, camera]);

  // Smoothly follow the newest block ONLY when "Follow latest block" toggle is ON and no block is inspected
  useEffect(() => {
    if (!followLatestBlock || selectedBlock) return;

    const controls = controlsRef.current;
    if (!controls) return;

    const activeBlocks = blocks.filter((b) => !b.isExiting);
    if (activeBlocks.length === 0) return;
    const totalActive = Math.max(1, activeBlocks.length);
    const latestBlock = activeBlocks[totalActive - 1];

    // Only animate if the latest block changed or if follow was just enabled
    if (lastFollowedNumberRef.current === latestBlock.number && lastFollowedNumberRef.current !== null) {
      return;
    }
    lastFollowedNumberRef.current = latestBlock.number;

    const [latestX, latestY, latestZ] = getBlockPosition(totalActive - 1, totalActive);

    const targetCamX = latestX + 0.5;
    const targetCamY = latestY + 2.0;
    const targetCamZ = latestZ + 14.0;

    const targetLookX = latestX;
    const targetLookY = latestY + 0.3;
    const targetLookZ = latestZ;

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    gsap.to(camera.position, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      duration: 1.0,
      ease: 'power2.out',
    });

    gsap.to(controls.target, {
      x: targetLookX,
      y: targetLookY,
      z: targetLookZ,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => {
        camera.lookAt(controls.target);
        controls.update();
      },
    });

    return () => {
      gsap.killTweensOf(camera.position);
      if (controls) gsap.killTweensOf(controls.target);
    };
  }, [followLatestBlock, selectedBlock, blocks, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
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
