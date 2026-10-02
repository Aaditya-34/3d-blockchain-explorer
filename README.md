# Nebula // 3D Blockchain Explorer

> An interactive, real-time 3D horizontal blockchain consensus visualizer built with React Three Fiber, Three.js, and GSAP.

---

## Preview

<!-- Replace with actual preview screenshot -->
![Nebula 3D Blockchain Explorer Preview](./public/preview.png)

*Preview: 3D blockchain visualizer featuring horizontal chain consensus, camera fly-to framing, dynamic block minting, and cyberpunk HUD.*

---

## Features

- **Interactive 3D Chain**: Renders a horizontal blockchain suspended in a cosmic deep-space environment with ambient stars, atmospheric depth fog, and dynamic cyber edge lighting.
- **Click-to-Inspect with Camera Fly-To**: Clicking any block smoothly animates both the camera position and `OrbitControls` target using GSAP (`power3.inOut`) to frame the selected block, with user controls disabled during transition to avoid animation conflicts.
- **Smooth Overview Return**: Closing the inspector drawer via the close button (✕), clicking empty space, or pressing the **Escape** key smoothly glides the camera back to the wide overview.
- **Live Block Minting Every 5s**: Automatically mints new blocks on a 5-second interval featuring a bouncy scale-in (`back.out`) and an explosive neon glow bloom, while shifting existing blocks to keep the newest block at the front.
- **Dynamic 15-Block Window**: The chain dynamically grows from 10 up to 15 blocks. Once 15 blocks are reached, the oldest block fades out smoothly (scaling to zero and fading opacity) before being pruned.
- **Transaction Particles & Floating Mempool**: Single high-performance `InstancedMesh` displaying a floating, organically drifting "mempool" cluster near the chain's leading edge. When a block is minted, the cluster and surrounding space feed glowing transaction particles (proportional to the block's transaction count, up to 80 particles) along curved trajectories into the new block, fading out as they arrive.
- **Parent-Hash Linking**: Every newly minted block cryptographically links to the previous block's exact hash via `parentHash`, preserving consensus integrity across the chain.
- **Glassmorphic Cyber HUD**: High-tech heads-up display overlay featuring:
  - **Pulsing "LIVE" Pill**: Glassmorphic status badge that ripples and pulses upon block arrival.
  - **Dynamic Metrics**: Live count of active synchronized blocks and current block height.
  - **Block Inspector**: Detailed breakdown of timestamps, transaction counts, block hash, parent hash, validator address, gas usage progress bar, and block reward.
  - **Quick-Step Navigation**: Step backwards and forwards between adjacent blocks with smooth camera glide transitions.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Component architecture & reactive UI state |
| **TypeScript** | Type-safe models, props, and Three.js geometry types |
| **Vite** | Lightning-fast development server & production bundler |
| **React Three Fiber (R3F)** | Declarative Three.js scene graph in React |
| **@react-three/drei** | Camera controls, 3D text typography, stars background, and wireframe edges |
| **Three.js** | Core WebGL 3D rendering engine, shaders, and geometry |
| **GSAP (GreenSock)** | Smooth camera transitions, block scale-in, glow flash, and chain shifting |

---

## Controls

| Action | Control |
|---|---|
| **Rotate Camera** | Left Click + Drag |
| **Pan Camera** | Right Click + Drag |
| **Zoom In / Out** | Scroll Wheel / Pinch |
| **Inspect Block** | Left Click on any 3D Block |
| **Return to Overview** | Press <kbd>Esc</kbd> or Click <kbd>✕</kbd> in Drawer |
| **Glide to Adjacent Block** | Click **← Previous** or **Next →** in Inspector |

---

## Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- npm, pnpm, or yarn

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aaditya-34/3d-blockchain-explorer.git
   cd 3d-blockchain-explorer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173/`.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## Roadmap

- [x] **Transaction Particles**: Visualizing individual transaction data particles streaming into blocks as they are mined, fed by a floating mempool.
- [ ] **Real Chain Data**: Connecting to live Ethereum Mainnet or Sepolia testnet via Alchemy/Infura RPC WebSocket feeds.
- [ ] **Search & Filter**: Direct search bar to find blocks by block height, hash, or miner address.
- [ ] **Mobile & Touch Optimization**: Responsive HUD drawer layout and multi-touch gestures for mobile screens.
- [ ] **Cloud Deployment**: One-click deployment configuration for Vercel and Cloudflare Pages.

---

## License

MIT © [Aaditya-34](https://github.com/Aaditya-34)
