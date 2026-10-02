import { useState } from 'react';
import { Scene } from './components/Scene';
import { HUD } from './components/HUD';
import { mockBlocks } from './data/mockBlocks';
import type { BlockData } from './data/mockBlocks';
import './App.css';

export default function App() {
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null);

  return (
    <main className="app-container">
      <Scene
        blocks={mockBlocks}
        selectedBlock={selectedBlock}
        onSelectBlock={setSelectedBlock}
      />
      <HUD
        blocks={mockBlocks}
        selectedBlock={selectedBlock}
        onSelectBlock={setSelectedBlock}
      />
    </main>
  );
}
