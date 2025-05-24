import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';
import { initializeStore } from "./utilities/store.ts";

initializeStore({
  // Set during application initialization inside `game`
  game: undefined!,
  consts: {
    tileSize: 64,
    chunkSize: 16,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  },
  entities: new Set(),
  entitiesByChunk: new Map(),
  activeChunkKeys: new Set(),
  activeChunksByKey: new Map()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
