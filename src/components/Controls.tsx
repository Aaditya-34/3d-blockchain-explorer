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
}

export function Controls({ selectedBlock, blocks }: ControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const isFirstRender = useRef(true);
  const prevBlockNumberRef = useRef<number | null>(null);

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
