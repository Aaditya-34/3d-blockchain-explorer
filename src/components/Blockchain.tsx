import { useMemo } from 'react';
import { Block } from './Block';
import { ConnectionLine } from './ConnectionLine';
import { BlockFormingFX } from './BlockFormingFX';
import type { BlockData } from '../data/mockBlocks';
import { BLOCK_SPACING, BLOCK_HALF_WIDTH } from '../utils/chainLayout';

interface BlockchainProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData) => void;
  cinematicMode?: boolean;
  formingStartTime?: number;
  formingBlockNumber?: number | null;
  onImpact?: () => void;
}

export function Blockchain({
  blocks,
  selectedBlock,
  onSelectBlock,
  cinematicMode = true,
  formingStartTime = 0,
  formingBlockNumber = null,
  onImpact,
}: BlockchainProps) {
  // Separate active and exiting blocks so active chain stays centered
  const activeBlocks = useMemo(
    () => blocks.filter((b) => !b.isExiting),
    [blocks]
  );

  // Map each block (including exiting) to its 3D position
  const blockPositions = useMemo(() => {
    const totalActive = Math.max(1, activeBlocks.length);
    let activeCounter = 0;

    return blocks.map((block) => {
      if (block.isExiting) {
        // Position exiting block just to the left of the chain
        const x = (-1 - (totalActive - 1) / 2) * BLOCK_SPACING;
        return [x, 0, 0] as [number, number, number];
      }
      const x = (activeCounter - (totalActive - 1) / 2) * BLOCK_SPACING;
      activeCounter++;
      return [x, 0, 0] as [number, number, number];
    });
  }, [blocks, activeBlocks]);

  // Pre-calculate positions for active connection lines
  const activePositions = useMemo(() => {
    const totalActive = Math.max(1, activeBlocks.length);
    return activeBlocks.map((_, i) => {
      const x = (i - (totalActive - 1) / 2) * BLOCK_SPACING;
      return [x, 0, 0] as [number, number, number];
    });
  }, [activeBlocks]);

  const latestActivePos = activePositions[activePositions.length - 1] ?? [0, 0, 0];

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Cinematic Block Forming FX (Stages 1, 2, 4) */}
      <BlockFormingFX
        position={latestActivePos}
        formingBlockNumber={formingBlockNumber}
        cinematicMode={cinematicMode}
        onImpact={onImpact ?? (() => {})}
      />

      {/* Glowing Blocks in Chain */}
      {blocks.map((block, i) => (
        <Block
          key={block.number}
          block={block}
          position={blockPositions[i]}
          index={i}
          isSelected={selectedBlock?.number === block.number}
          onSelect={onSelectBlock}
          cinematicMode={cinematicMode}
          isForming={formingBlockNumber === block.number}
        />
      ))}

      {/* Thin Light Lines connecting adjacent active blocks */}
      {activeBlocks.slice(0, -1).map((block, i) => {
        const nextBlock = activeBlocks[i + 1];
        const startX = activePositions[i][0] + BLOCK_HALF_WIDTH;
        const endX = activePositions[i + 1][0] - BLOCK_HALF_WIDTH;
        const isNewLink = i === activeBlocks.length - 2;

        return (
          <ConnectionLine
            key={`conn-${block.number}-${nextBlock.number}`}
            start={[startX, 0, 0]}
            end={[endX, 0, 0]}
            index={i}
            isNewLink={isNewLink}
            cinematicMode={cinematicMode}
            formingStartTime={formingStartTime}
          />
        );
      })}
    </group>
  );
}
