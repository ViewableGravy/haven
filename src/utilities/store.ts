import type { Application } from "pixi.js";
import type { BaseEntity } from "../entities/base";
import type { Chunk } from "./chunkManager/type";
import { Position } from "./position";
import { SubscribablePosition } from "./position/subscribable";
import type { ChunkKey } from "./tagged";

type GlobalStore = {
  game: {
    app: Application;
    worldPointer: Position;
    screenPointer: Position;
    worldOffset: SubscribablePosition;
  },

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
}
