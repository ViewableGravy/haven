import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';
import { Position } from "./utilities/position/index.ts";
import { SubscribablePosition } from "./utilities/position/subscribable.ts";
import { initializeStore } from "./utilities/store.ts";

initializeStore({
  game: {
    app: undefined!,
    worldPointer: new Position(0, 0, "global"),
    screenPointer: new Position(0, 0, "screenspace"),
    worldOffset: new SubscribablePosition(0, 0),
  },
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
