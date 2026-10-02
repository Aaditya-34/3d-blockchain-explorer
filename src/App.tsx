import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { HUD } from './components/HUD';
import { mockBlocks, createNewBlock } from './data/mockBlocks';
import type { BlockData } from './data/mockBlocks';
import './App.css';

export default function App() {
  const [blocks, setBlocks] = useState<BlockData[]>(mockBlocks);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [isLivePulsing, setIsLivePulsing] = useState(false);

  // Return to overview on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBlock(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prune exiting blocks after fade-out animation completes
  useEffect(() => {
    const exitingBlock = blocks.find((b) => b.isExiting);
    if (!exitingBlock) return;

    const timer = setTimeout(() => {
      setSelectedBlock((current) =>
        current?.number === exitingBlock.number ? null : current
      );
      setBlocks((current) =>
        current.filter((b) => b.number !== exitingBlock.number)
      );
    }, 750);

    return () => clearTimeout(timer);
  }, [blocks]);

  // Every 5 seconds: mint new block, shift chain, only mark oldest as exiting when non-exiting blocks > 15
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger live pulse animation in HUD
      setIsLivePulsing(true);
      setTimeout(() => setIsLivePulsing(false), 1400);

      setBlocks((prevBlocks) => {
        const nonExiting = prevBlocks.filter((b) => !b.isExiting);
        if (nonExiting.length === 0) return prevBlocks;

        const latestBlock = nonExiting[nonExiting.length - 1];
        const newBlock = createNewBlock(latestBlock);

        // Update timestamps and statuses of existing blocks
        const updated = prevBlocks.map((b) => {
          if (b.number === latestBlock.number) {
            return { ...b, status: 'confirmed' as const, timestamp: '5s ago' };
          }
          const age = (newBlock.number - b.number) * 5;
          const status =
            newBlock.number - b.number > 3
              ? ('finalized' as const)
              : ('confirmed' as const);
          return { ...b, status, timestamp: `${age}s ago` };
        });

        let nextBlocks = [...updated, newBlock];
        const currentNonExiting = nextBlocks.filter((b) => !b.isExiting);

        // Only mark the oldest block as exiting when the number of non-exiting blocks is greater than 15
        if (currentNonExiting.length > 15) {
          const oldestNumber = currentNonExiting[0].number;
          nextBlocks = nextBlocks.map((b) =>
            b.number === oldestNumber ? { ...b, isExiting: true } : b
          );
        }

        return nextBlocks;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="app-container">
      <Scene
        blocks={blocks}
        selectedBlock={selectedBlock}
        onSelectBlock={setSelectedBlock}
      />
      <HUD
        blocks={blocks}
        selectedBlock={selectedBlock}
        onSelectBlock={setSelectedBlock}
        isLivePulsing={isLivePulsing}
      />
    </main>
  );
}
