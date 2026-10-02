import { useState, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { HUD } from './components/HUD';
import { mockBlocks, createNewBlock } from './data/mockBlocks';
import type { BlockData } from './data/mockBlocks';
import { fetchLatest10Blocks, fetchNewestBlock } from './services/ethereum';
import './App.css';

export interface ToastData {
  id: number;
  blockNumber: number;
  txCount: number;
  shortHash: string;
}

export default function App() {
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('live');
  const [blocks, setBlocks] = useState<BlockData[]>(mockBlocks);
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);
  const [isLivePulsing, setIsLivePulsing] = useState(false);
  const [cinematicMode, setCinematicMode] = useState(true);
  const [followLatestBlock, setFollowLatestBlock] = useState(false);
  const [formingStartTime, setFormingStartTime] = useState<number>(0);
  const [formingBlockNumber, setFormingBlockNumber] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [rpcStatusMessage, setRpcStatusMessage] = useState<string | null>(null);

  const consecutiveErrorsRef = useRef(0);
  const isPollingRef = useRef(false);

  // Auto-dismiss HUD toast after 4.2 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4200);
    return () => clearTimeout(timer);
  }, [toast]);

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

  // Initial Ethereum fetch on startup when in live mode
  useEffect(() => {
    if (dataMode !== 'live') return;

    let cancelled = false;
    fetchLatest10Blocks()
      .then((ethBlocks) => {
        if (cancelled) return;
        setBlocks(ethBlocks);
        setRpcStatusMessage(null);
        consecutiveErrorsRef.current = 0;
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Initial Ethereum RPC fetch failed:', err);
        setRpcStatusMessage('RPC unreachable. Falling back to Demo mode.');
        setDataMode('demo');
        setBlocks(mockBlocks);
      });

    return () => {
      cancelled = true;
    };
  }, [dataMode]);

  // LIVE MODE: Poll Ethereum Mainnet for newest block every 6s with exponential backoff on error
  useEffect(() => {
    if (dataMode !== 'live') return;

    let timerId: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled || isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const newest = await fetchNewestBlock();
        if (isCancelled) return;

        consecutiveErrorsRef.current = 0;
        setRpcStatusMessage(null);

        setBlocks((prevBlocks) => {
          const nonExiting = prevBlocks.filter((b) => !b.isExiting);
          if (nonExiting.length === 0) return prevBlocks;

          const latestBlock = nonExiting[nonExiting.length - 1];

          // If block is not newer, just update relative timestamps
          if (newest.number <= latestBlock.number) {
            return prevBlocks.map((b) => {
              const diffSec = (newest.number - b.number) * 12;
              return {
                ...b,
                timestamp: diffSec < 6 ? 'Just now' : `${diffSec}s ago`,
              };
            });
          }

          // A new Ethereum block arrived! Trigger cinematic sequence & toast
          const now = performance.now();
          setFormingStartTime(now);
          setFormingBlockNumber(newest.number);
          setIsLivePulsing(true);
          setTimeout(() => setIsLivePulsing(false), 1400);

          setToast({
            id: newest.number,
            blockNumber: newest.number,
            txCount: newest.txCount,
            shortHash: `${newest.hash.slice(0, 8)}...${newest.hash.slice(-6)}`,
          });

          // Mark previous latest as confirmed and update older ages
          const updated = prevBlocks.map((b) => {
            if (b.number === latestBlock.number) {
              return { ...b, status: 'confirmed' as const, timestamp: '12s ago' };
            }
            const age = (newest.number - b.number) * 12;
            const status =
              newest.number - b.number > 3
                ? ('finalized' as const)
                : ('confirmed' as const);
            return { ...b, status, timestamp: `${age}s ago` };
          });

          let nextBlocks = [...updated, newest];
          const currentNonExiting = nextBlocks.filter((b) => !b.isExiting);

          // Keep 15-block window: only mark the oldest block as exiting when non-exiting > 15
          if (currentNonExiting.length > 15) {
            const oldestNumber = currentNonExiting[0].number;
            nextBlocks = nextBlocks.map((b) =>
              b.number === oldestNumber ? { ...b, isExiting: true } : b
            );
          }

          return nextBlocks;
        });
      } catch (err: unknown) {
        if (isCancelled) return;
        consecutiveErrorsRef.current++;
        const errorMsg = err instanceof Error ? err.message : 'Connection failed';
        console.warn('Ethereum polling error:', errorMsg);

        // Exponential backoff
        const nextDelay = Math.min(
          30000,
          6000 * Math.pow(1.5, consecutiveErrorsRef.current)
        );
        setRpcStatusMessage(`RPC issue (retry in ${Math.round(nextDelay / 1000)}s)`);

        // Fallback to Demo mode after 3 consecutive errors
        if (consecutiveErrorsRef.current >= 3) {
          setRpcStatusMessage('RPC rate-limited. Switched to Demo mode.');
          setDataMode('demo');
          return;
        }
      } finally {
        isPollingRef.current = false;
        if (!isCancelled) {
          const delay = consecutiveErrorsRef.current > 0
            ? Math.min(30000, 6000 * Math.pow(1.5, consecutiveErrorsRef.current))
            : 6000;
          timerId = setTimeout(poll, delay);
        }
      }
    };

    // Start initial poll after 6 seconds
    timerId = setTimeout(poll, 6000);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [dataMode]);

  // DEMO MODE: Mint mock blocks every 5 seconds
  useEffect(() => {
    if (dataMode !== 'demo') return;

    const interval = setInterval(() => {
      const now = performance.now();
      setFormingStartTime(now);

      // Trigger live pulse animation in HUD
      setIsLivePulsing(true);
      setTimeout(() => setIsLivePulsing(false), 1400);

      setBlocks((prevBlocks) => {
        const nonExiting = prevBlocks.filter((b) => !b.isExiting);
        if (nonExiting.length === 0) return prevBlocks;

        const latestBlock = nonExiting[nonExiting.length - 1];
        const newBlock = createNewBlock(latestBlock);

        setFormingBlockNumber(newBlock.number);

        // Stage 6: Small HUD toast notification
        setToast({
          id: newBlock.number,
          blockNumber: newBlock.number,
          txCount: newBlock.txCount,
          shortHash: `${newBlock.hash.slice(0, 8)}...${newBlock.hash.slice(-6)}`,
        });

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
  }, [dataMode]);

  const handleSelectBlock = (block: BlockData | null) => {
    if (block) {
      setFollowLatestBlock(false);
    }
    setSelectedBlock(block);
  };

  const handleToggleDataMode = () => {
    if (dataMode === 'live') {
      setDataMode('demo');
      setRpcStatusMessage(null);
      consecutiveErrorsRef.current = 0;
    } else {
      setDataMode('live');
      setRpcStatusMessage(null);
      consecutiveErrorsRef.current = 0;
    }
  };

  return (
    <main className="app-container">
      <Scene
        blocks={blocks}
        selectedBlock={selectedBlock}
        onSelectBlock={handleSelectBlock}
        cinematicMode={cinematicMode}
        formingStartTime={formingStartTime}
        formingBlockNumber={formingBlockNumber}
        followLatestBlock={followLatestBlock}
        onDisableFollowLatest={() => setFollowLatestBlock(false)}
      />
      <HUD
        blocks={blocks}
        selectedBlock={selectedBlock}
        onSelectBlock={handleSelectBlock}
        isLivePulsing={isLivePulsing}
        cinematicMode={cinematicMode}
        onToggleCinematic={() => setCinematicMode((prev) => !prev)}
        followLatestBlock={followLatestBlock}
        onToggleFollowLatest={() => setFollowLatestBlock((prev) => !prev)}
        dataMode={dataMode}
        onToggleDataMode={handleToggleDataMode}
        rpcStatusMessage={rpcStatusMessage}
        onDismissRpcStatus={() => setRpcStatusMessage(null)}
        toast={toast}
        onDismissToast={() => setToast(null)}
      />
    </main>
  );
}
