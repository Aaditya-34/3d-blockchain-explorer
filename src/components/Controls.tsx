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
  formingStartTime?: number;
  cinematicMode?: boolean;
}

export function Controls({
  selectedBlock,
  blocks,
  formingStartTime = 0,
  cinematicMode = true,
}: ControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const isFirstRender = useRef(true);
  const prevBlockNumberRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);

  // Track user interaction to prevent any camera nudges while user is controlling the camera
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isUserInteractingRef.current = true;
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
    };

    const onEnd = () => {
      isUserInteractingRef.current = false;
    };

    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, [camera]);

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

    // If both are null, don't trigger camera moves on routine block ticks
    if (prevNumber === null && currentNumber === null) {
      return;
    }

    prevBlockNumberRef.current = currentNumber;

    // Disable controls during camera animation to prevent fighting
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

      const isShiftOnly = prevNumber === currentNumber;
      const duration = isShiftOnly ? 0.7 : 1.15;
      const ease = isShiftOnly ? 'power2.out' : 'power3.inOut';

      gsap.to(camera.position, {
        x: targetCamX,
        y: targetCamY,
        z: targetCamZ,
        duration,
        ease,
      });

      gsap.to(controls.target, {
        x: targetLookX,
        y: targetLookY,
        z: targetLookZ,
        duration,
        ease,
        onUpdate: () => {
          camera.lookAt(controls.target);
        },
        onComplete: () => {
          controls.update();
          controls.enabled = true;
        },
      });
    } else {
      // Smooth return to overview
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

  // Subtle camera nudge toward the new block during mint sequence
  useEffect(() => {
    // Only nudge when user is NOT inspecting a block and NOT actively manipulating controls
    if (!formingStartTime || selectedBlock || isUserInteractingRef.current) return;

    const controls = controlsRef.current;
    if (!controls) return;

    const activeBlocks = blocks.filter((b) => !b.isExiting);
    if (activeBlocks.length === 0) return;
    const totalActive = Math.max(1, activeBlocks.length);
    const [latestX] = getBlockPosition(totalActive - 1, totalActive);

    const nudgeDuration = cinematicMode ? 1.4 : 0.45;
    const returnDuration = cinematicMode ? 1.4 : 0.45;

    // Subtle offset toward new block
    const nudgeCamX = latestX * 0.1;
    const nudgeCamY = 4.2;
    const nudgeCamZ = 24.5;
    const nudgeTargetX = latestX * 0.07;

    const tl = gsap.timeline({
      onUpdate: () => {
        if (!isUserInteractingRef.current) {
          camera.lookAt(controls.target);
          controls.update();
        }
      },
    });

    tl.to(
      camera.position,
      {
        x: nudgeCamX,
        y: nudgeCamY,
        z: nudgeCamZ,
        duration: nudgeDuration,
        ease: 'power2.out',
      },
      0
    );

    tl.to(
      controls.target,
      {
        x: nudgeTargetX,
        duration: nudgeDuration,
        ease: 'power2.out',
      },
      0
    );

    // Return to centered overview
    tl.to(
      camera.position,
      {
        x: 0,
        y: 4,
        z: 25,
        duration: returnDuration,
        ease: 'power2.inOut',
      },
      nudgeDuration
    );

    tl.to(
      controls.target,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: returnDuration,
        ease: 'power2.inOut',
      },
      nudgeDuration
    );

    return () => {
      tl.kill();
    };
  }, [formingStartTime, selectedBlock, blocks, camera, cinematicMode]);

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
