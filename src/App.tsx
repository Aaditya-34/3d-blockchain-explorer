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

  // Every 5 seconds: mint new block, shift chain, limit to max 15 blocks (oldest fading out)
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger live pulse animation in HUD
      setIsLivePulsing(true);
      setTimeout(() => setIsLivePulsing(false), 1400);

      setBlocks((prevBlocks) => {
        const active = prevBlocks.filter((b) => !b.isExiting);
        if (active.length === 0) return prevBlocks;

        const latestBlock = active[active.length - 1];
        const newBlock = createNewBlock(latestBlock);

        // Keep at most 15 blocks: oldest fades out
        if (active.length >= 15) {
          const oldestNumber = active[0].number;

          // Deselect if the exiting block is currently inspected
          setSelectedBlock((current) =>
            current?.number === oldestNumber ? null : current
          );

          const updated = prevBlocks.map((b) => {
            if (b.number === oldestNumber) {
              return { ...b, isExiting: true };
            }
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

          // After fade-out animation completes (750ms), prune the oldest block from state
          setTimeout(() => {
            setBlocks((current) =>
              current.filter((b) => b.number !== oldestNumber)
            );
          }, 750);

          return [...updated, newBlock];
        } else {
          // Less than 15 blocks: append newest
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
          return [...updated, newBlock];
        }
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
