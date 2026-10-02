import { useState } from 'react';
import type { BlockData } from '../data/mockBlocks';

interface HUDProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData | null) => void;
}

export function HUD({ blocks, selectedBlock, onSelectBlock }: HUDProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestBlock = blocks[blocks.length - 1];

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

        <div className="network-pill">
          <span className="live-indicator" />
          <span className="network-name">MAINNET</span>
          <span className="divider">|</span>
          <span className="metric">10 Blocks Synced</span>
          <span className="divider">|</span>
          <span className="metric">Latest: #{latestBlock?.number}</span>
        </div>
      </header>

      {/* Block Inspector Sidebar / Card */}
      {selectedBlock && (
        <aside className="block-inspector">
          <div className="inspector-header">
            <div>
              <span className={`status-badge status-${selectedBlock.status}`}>
                {selectedBlock.status.toUpperCase()}
              </span>
              <h2 className="inspector-title">Block #{selectedBlock.number}</h2>
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
              <div className="info-value">{selectedBlock.timestamp}</div>
            </div>

            <div className="info-group">
              <label>Transactions</label>
              <div className="info-value highlight-cyan">
                {selectedBlock.txCount} transactions
              </div>
            </div>

            <div className="info-group">
              <label>Block Hash</label>
              <div className="hash-row">
                <span className="hash-code" title={selectedBlock.hash}>
                  {selectedBlock.hash.slice(0, 14)}...{selectedBlock.hash.slice(-10)}
                </span>
                <button
                  className="copy-btn"
                  onClick={() => copyHash(selectedBlock.hash)}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="info-group">
              <label>Parent Hash</label>
              <div className="hash-code faint" title={selectedBlock.parentHash}>
                {selectedBlock.parentHash.slice(0, 14)}...{selectedBlock.parentHash.slice(-10)}
              </div>
            </div>

            <div className="info-group">
              <label>Miner / Validator</label>
              <div className="hash-code">{selectedBlock.miner}</div>
            </div>

            <div className="info-group">
              <label>Gas Used</label>
              <div className="info-value">{selectedBlock.gasUsed}</div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: selectedBlock.gasUsed.split('(')[1]?.replace('%)', '') || '50%',
                  }}
                />
              </div>
            </div>

            <div className="info-row-dual">
              <div className="info-group">
                <label>Size</label>
                <div className="info-value">{selectedBlock.size}</div>
              </div>
              <div className="info-group">
                <label>Block Reward</label>
                <div className="info-value highlight-pink">{selectedBlock.reward}</div>
              </div>
            </div>
          </div>

          {/* Quick Step Buttons */}
          <div className="inspector-footer">
            <button
              className="nav-btn"
              disabled={selectedBlock.number === blocks[0].number}
              onClick={() => {
                const idx = blocks.findIndex((b) => b.number === selectedBlock.number);
                if (idx > 0) onSelectBlock(blocks[idx - 1]);
              }}
            >
              ← Previous
            </button>
            <button
              className="nav-btn"
              disabled={selectedBlock.number === blocks[blocks.length - 1].number}
              onClick={() => {
                const idx = blocks.findIndex((b) => b.number === selectedBlock.number);
                if (idx < blocks.length - 1) onSelectBlock(blocks[idx + 1]);
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
        </div>
      </footer>
    </div>
  );
}
