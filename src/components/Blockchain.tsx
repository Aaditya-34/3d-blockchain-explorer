import { useMemo } from 'react';
import { Block } from './Block';
import { ConnectionLine } from './ConnectionLine';
import type { BlockData } from '../data/mockBlocks';

interface BlockchainProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData) => void;
}

const BLOCK_SPACING = 3.6;
const BLOCK_HALF_WIDTH = 0.8;

export function Blockchain({
  blocks,
  selectedBlock,
  onSelectBlock,
}: BlockchainProps) {
  // Pre-calculate positions for all blocks
  const blockPositions = useMemo(() => {
    const total = blocks.length;
    return blocks.map((_, i) => {
      const x = (i - (total - 1) / 2) * BLOCK_SPACING;
      return [x, 0, 0] as [number, number, number];
    });
  }, [blocks]);

  return (
    <group position={[0, 0, 0]}>
      {/* 10 Glowing Blocks */}
      {blocks.map((block, i) => (
        <Block
          key={block.number}
          block={block}
          position={blockPositions[i]}
          index={i}
          isSelected={selectedBlock?.number === block.number}
          onSelect={onSelectBlock}
        />
      ))}

      {/* Thin Light Lines connecting adjacent blocks */}
      {blocks.slice(0, -1).map((_, i) => {
        const startX = blockPositions[i][0] + BLOCK_HALF_WIDTH;
        const endX = blockPositions[i + 1][0] - BLOCK_HALF_WIDTH;

        return (
          <ConnectionLine
            key={`conn-${i}`}
            start={[startX, 0, 0]}
            end={[endX, 0, 0]}
            index={i}
          />
        );
      })}
    </group>
  );
}
