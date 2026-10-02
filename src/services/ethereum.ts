import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { BlockData } from '../data/mockBlocks';

// Default free public RPC endpoints for Ethereum mainnet
export const DEFAULT_RPC_URL = 'https://ethereum-rpc.publicnode.com';

// Optional override via environment variable (never commit API keys)
export const RPC_URL = (import.meta.env.VITE_RPC_URL as string) || DEFAULT_RPC_URL;

const FALLBACK_RPCS = [
  RPC_URL,
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
];

let activeRpcIndex = 0;

export function getPublicClient(rpcUrl = FALLBACK_RPCS[activeRpcIndex]) {
  return createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl, {
      timeout: 7000,
      retryCount: 1,
    }),
  });
}

function rotateRpc() {
  activeRpcIndex = (activeRpcIndex + 1) % FALLBACK_RPCS.length;
  return FALLBACK_RPCS[activeRpcIndex];
}

/**
 * Maps a viem Ethereum block into the Explorer's BlockData type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatEthereumBlock(block: any, status: 'latest' | 'confirmed' | 'finalized'): BlockData {
  const num = Number(block.number);
  const gasUsedBig = BigInt(block.gasUsed || 0);
  const gasLimitBig = BigInt(block.gasLimit || 30000000);
  const gasPct = gasLimitBig > 0n
    ? ((Number(gasUsedBig * 1000n / gasLimitBig)) / 10).toFixed(1)
    : '0.0';
  const gasUsedFormatted = `${gasUsedBig.toLocaleString('en-US')} (${gasPct}%)`;
  const gasLimitFormatted = gasLimitBig.toLocaleString('en-US');
  const sizeKb = block.size ? `${(Number(block.size) / 1024).toFixed(1)} KB` : '82.4 KB';

  // Relative timestamp calculation
  const nowSec = Math.floor(Date.now() / 1000);
  const blockTimeSec = Number(block.timestamp);
  const diffSec = Math.max(0, nowSec - blockTimeSec);
  const timestampStr = diffSec < 6 ? 'Just now' : `${diffSec}s ago`;

  return {
    number: num,
    hash: block.hash || '0x',
    parentHash: block.parentHash || '0x',
    timestamp: timestampStr,
    txCount: block.transactions ? block.transactions.length : 0,
    miner: block.miner || '0x0000000000000000000000000000000000000000',
    gasUsed: gasUsedFormatted,
    gasLimit: gasLimitFormatted,
    size: sizeKb,
    reward: '2.00 ETH',
    status,
  };
}

/**
 * Fetches the latest 10 blocks on startup from Ethereum Mainnet
 */
export async function fetchLatest10Blocks(): Promise<BlockData[]> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < FALLBACK_RPCS.length; attempt++) {
    const rpc = FALLBACK_RPCS[activeRpcIndex];
    try {
      const client = getPublicClient(rpc);
      const latestBlockNumber = await client.getBlockNumber();
      
      const count = 10;
      const promises = [];
      for (let i = count - 1; i >= 0; i--) {
        const blockNum = latestBlockNumber - BigInt(i);
        promises.push(
          client.getBlock({
            blockNumber: blockNum,
            includeTransactions: false,
          })
        );
      }

      const rawBlocks = await Promise.all(promises);
      return rawBlocks.map((b, idx) => {
        const isLatest = idx === rawBlocks.length - 1;
        const status = isLatest ? 'latest' : (idx < count - 4 ? 'finalized' : 'confirmed');
        return formatEthereumBlock(b, status);
      });
    } catch (err) {
      lastError = err;
      rotateRpc();
    }
  }

  throw lastError || new Error('Failed to fetch initial Ethereum blocks from all public RPCs');
}

/**
 * Fetches the latest single block from Ethereum Mainnet
 */
export async function fetchNewestBlock(): Promise<BlockData> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < FALLBACK_RPCS.length; attempt++) {
    const rpc = FALLBACK_RPCS[activeRpcIndex];
    try {
      const client = getPublicClient(rpc);
      const rawBlock = await client.getBlock({
        blockTag: 'latest',
        includeTransactions: false,
      });
      return formatEthereumBlock(rawBlock, 'latest');
    } catch (err) {
      lastError = err;
      rotateRpc();
    }
  }

  throw lastError || new Error('Failed to fetch latest block from public RPC');
}
