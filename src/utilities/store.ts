import type { BaseEntity } from "../entities/base";
import type { Chunk } from "./chunkManager/type";
import type { ChunkKey } from "./tagged";

type GlobalStore = {
  consts: {
    tileSize: number;
    chunkSize: number;
    chunkAbsolute: number;
  },

  entities: Set<BaseEntity>;
  entitiesByChunk: Map<ChunkKey, Set<BaseEntity>>;

  activeChunkKeys: Set<ChunkKey>;
  activeChunksByKey: Map<ChunkKey, Chunk>;
}

export const store: GlobalStore = {
  consts: {
    tileSize: 64,
    chunkSize: 16,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  },
  entities: new Set(),
  entitiesByChunk: new Map(),
  activeChunkKeys: new Set(),
  activeChunksByKey: new Map()
}
