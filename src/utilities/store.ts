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

export let store: GlobalStore = undefined!;

export const initializeStore = (opts: GlobalStore) => { store = opts };
