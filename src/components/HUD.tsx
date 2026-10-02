import { useState } from 'react';
import type { BlockData } from '../data/mockBlocks';
import type { ToastData } from '../App';

interface HUDProps {
  blocks: BlockData[];
  selectedBlock: BlockData | null;
  onSelectBlock: (block: BlockData | null) => void;
  isLivePulsing: boolean;
  cinematicMode: boolean;
  onToggleCinematic: () => void;
  followLatestBlock: boolean;
  onToggleFollowLatest: () => void;
  dataMode: 'live' | 'demo';
  onToggleDataMode: () => void;
  rpcStatusMessage: string | null;
  onDismissRpcStatus: () => void;
  toast: ToastData | null;
  onDismissToast: () => void;
}

export function HUD({
  blocks,
  selectedBlock,
  onSelectBlock,
  isLivePulsing,
  cinematicMode,
  onToggleCinematic,
  followLatestBlock,
  onToggleFollowLatest,
  dataMode,
  onToggleDataMode,
  rpcStatusMessage,
  onDismissRpcStatus,
  toast,
  onDismissToast,
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
          {/* Data Mode Toggle: LIVE (Ethereum) vs DEMO (mock) */}
          <button
            className={`data-mode-toggle ${dataMode === 'live' ? 'mode-live' : 'mode-demo'}`}
            onClick={onToggleDataMode}
            title={
              dataMode === 'live'
                ? 'Connected to Ethereum Mainnet RPC. Click to switch to DEMO mode.'
                : 'Running simulated DEMO blocks. Click to connect to real Ethereum Mainnet.'
            }
          >
            <span className={`data-mode-dot ${dataMode === 'live' ? 'dot-live' : 'dot-demo'}`} />
            <span className="data-mode-text">
              {dataMode === 'live' ? 'LIVE (Ethereum)' : 'DEMO (mock)'}
            </span>
          </button>

          {/* Follow Latest Block Toggle (default OFF, auto-disables on drag/pan/zoom) */}
          <button
            className={`follow-toggle-btn ${followLatestBlock ? 'active' : ''}`}
            onClick={onToggleFollowLatest}
            title={
              followLatestBlock
                ? 'Follow Latest Block: ON (smoothly follows newest block; auto-disables on drag/pan/zoom)'
                : 'Follow Latest Block: OFF (camera is completely free)'
            }
          >
            <span className="follow-icon">🎯</span>
            <span className="follow-label">FOLLOW LATEST</span>
            <span className={`follow-badge ${followLatestBlock ? 'badge-on' : 'badge-off'}`}>
              {followLatestBlock ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Cinematic Mode Toggle */}
          <button
            className={`cinematic-toggle-btn ${cinematicMode ? 'active' : ''}`}
            onClick={onToggleCinematic}
            title={cinematicMode ? 'Cinematic Mode: Active (~3s sequence)' : 'Cinematic Mode: Off (Fast sequence for low-end devices)'}
          >
            <span className="cinematic-icon">⚡</span>
            <span className="cinematic-label">CINEMATIC</span>
            <span className={`cinematic-badge ${cinematicMode ? 'badge-on' : 'badge-off'}`}>
              {cinematicMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Pulsing LIVE Pill */}
          <div
            className={`live-pill ${isLivePulsing ? 'live-pill-pulsing' : ''}`}
            title={dataMode === 'live' ? 'Consensus feed is live from Ethereum Mainnet' : 'Consensus feed is live in Demo mode (minting every 5s)'}
          >
            <span className="live-pill-dot" />
            <span className="live-pill-text">{dataMode === 'live' ? 'ETH' : 'DEMO'}</span>
          </div>

          <div className="network-pill">
            <span className={`live-indicator ${dataMode === 'live' ? 'indicator-eth' : ''}`} />
            <span className="network-name">{dataMode === 'live' ? 'ETHEREUM' : 'SIMULATED'}</span>
            <span className="divider">|</span>
            <span className="metric">{activeBlocks.length} Blocks</span>
            <span className="divider">|</span>
            <span className="metric">Latest: #{latestBlock?.number}</span>
          </div>
        </div>
      </header>

      {/* RPC Warning / Status Message banner if RPC issues occur */}
      {rpcStatusMessage && (
        <div className="rpc-status-banner">
          <span className="rpc-status-icon">⚠️</span>
          <span className="rpc-status-msg">{rpcStatusMessage}</span>
          <button
            className="rpc-status-close"
            onClick={onDismissRpcStatus}
            aria-label="Dismiss RPC status"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stage 6: Small HUD Toast Notification */}
      {toast && (
        <div
          className="hud-toast"
          onClick={onDismissToast}
          role="status"
          aria-live="polite"
        >
          <div className="hud-toast-glow" />
          <div className="hud-toast-badge">MINED</div>
          <div className="hud-toast-body">
            <span className="hud-toast-title">Block #{toast.blockNumber} mined</span>
            <span className="hud-toast-details">
              <span className="hud-toast-tx">{toast.txCount} txs</span>
              <span className="hud-toast-sep">•</span>
              <span className="hud-toast-hash" title={toast.shortHash}>
                {toast.shortHash}
              </span>
            </span>
          </div>
          <button
            className="hud-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              onDismissToast();
            }}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

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
