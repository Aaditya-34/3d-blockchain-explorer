import { useState } from 'react';
import type { BlockData } from '../data/mockBlocks';

interface HUDProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData | null) => void;
  isLivePulsing: boolean;
}

export function HUD({
  blocks,
  selectedBlock,
  onSelectBlock,
  isLivePulsing,
}: HUDProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeBlocks = blocks.filter((b) => !b.isExiting);
  const latestBlock = activeBlocks[activeBlocks.length - 1];
  const currentBlock = selectedBlock
    ? blocks.find((b) => b.number === selectedBlock.number && !b.isExiting) ?? null
    : null;

  return (
    <div className="hud-overlay">
      {/* Top Navigation / Status Header */}
      <header className="hud-header">
        <div className="brand">
          <div className="brand-dot" />
          <div>
            <h1 className="brand-title">NEBULA // 3D EXPLORER</h1>
            <p className="brand-subtitle">Horizontal Chain Consensus Visualizer</p>
          </div>
        </div>

        <div className="hud-header-right">
          {/* Pulsing LIVE Pill */}
          <div
            className={`live-pill ${isLivePulsing ? 'live-pill-pulsing' : ''}`}
            title="Consensus feed is live (minting every 5s)"
          >
            <span className="live-pill-dot" />
            <span className="live-pill-text">LIVE</span>
          </div>

          <div className="network-pill">
            <span className="live-indicator" />
            <span className="network-name">MAINNET</span>
            <span className="divider">|</span>
            <span className="metric">{activeBlocks.length} Blocks Synced</span>
            <span className="divider">|</span>
            <span className="metric">Latest: #{latestBlock?.number}</span>
          </div>
        </div>
      </header>

      {/* Block Inspector Sidebar / Card */}
      {currentBlock && (
        <aside className="block-inspector">
          <div className="inspector-header">
            <div>
              <span className={`status-badge status-${currentBlock.status}`}>
                {currentBlock.status.toUpperCase()}
              </span>
              <h2 className="inspector-title">Block #{currentBlock.number}</h2>
            </div>
            <button
              className="close-button"
              onClick={() => onSelectBlock(null)}
              aria-label="Close details"
            >
              ✕
            </button>
          </div>

          <div className="inspector-grid">
            <div className="info-group">
              <label>Timestamp</label>
              <div className="info-value">{currentBlock.timestamp}</div>
            </div>

            <div className="info-group">
              <label>Transactions</label>
              <div className="info-value highlight-cyan">
                {currentBlock.txCount} transactions
              </div>
            </div>

            <div className="info-group">
              <label>Block Hash</label>
              <div className="hash-row">
                <span className="hash-code" title={currentBlock.hash}>
                  {currentBlock.hash.slice(0, 14)}...{currentBlock.hash.slice(-10)}
                </span>
                <button
                  className="copy-btn"
                  onClick={() => copyHash(currentBlock.hash)}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="info-group">
              <label>Parent Hash</label>
              <div className="hash-code faint" title={currentBlock.parentHash}>
                {currentBlock.parentHash.slice(0, 14)}...{currentBlock.parentHash.slice(-10)}
              </div>
            </div>

            <div className="info-group">
              <label>Miner / Validator</label>
              <div className="hash-code">{currentBlock.miner}</div>
            </div>

            <div className="info-group">
              <label>Gas Used</label>
              <div className="info-value">{currentBlock.gasUsed}</div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: currentBlock.gasUsed.split('(')[1]?.replace('%)', '') || '50%',
                  }}
                />
              </div>
            </div>

            <div className="info-row-dual">
              <div className="info-group">
                <label>Size</label>
                <div className="info-value">{currentBlock.size}</div>
              </div>
              <div className="info-group">
                <label>Block Reward</label>
                <div className="info-value highlight-pink">{currentBlock.reward}</div>
              </div>
            </div>
          </div>

          {/* Quick Step Buttons */}
          <div className="inspector-footer">
            <button
              className="nav-btn"
              disabled={currentBlock.number === activeBlocks[0]?.number}
              onClick={() => {
                const idx = activeBlocks.findIndex((b) => b.number === currentBlock.number);
                if (idx > 0) onSelectBlock(activeBlocks[idx - 1]);
              }}
            >
              ← Previous
            </button>
            <button
              className="nav-btn"
              disabled={currentBlock.number === activeBlocks[activeBlocks.length - 1]?.number}
              onClick={() => {
                const idx = activeBlocks.findIndex((b) => b.number === currentBlock.number);
                if (idx < activeBlocks.length - 1) onSelectBlock(activeBlocks[idx + 1]);
              }}
            >
              Next →
            </button>
          </div>
        </aside>
      )}

      {/* Bottom Controls Legend */}
      <footer className="hud-footer">
        <div className="controls-hint">
          <span className="kbd">Left Click + Drag</span> Rotate
          <span className="dot">•</span>
          <span className="kbd">Right Click + Drag</span> Pan
          <span className="dot">•</span>
          <span className="kbd">Scroll</span> Zoom
          <span className="dot">•</span>
          <span className="kbd">Click Block</span> Inspect
          <span className="dot">•</span>
          <span className="kbd">Esc</span> Overview
        </div>
      </footer>
    </div>
  );
}
