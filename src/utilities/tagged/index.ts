

import type { Tagged } from "type-fest";
import type { Position } from "../position/types";

/***** TYPE DEFINITIONS *****/
export type ChunkKey = Tagged<string, "ChunkKey">;
export type EntityId = Tagged<number, "EntityId">;

/***** FUNCTIONS *****/
export function createChunkKey(position: Position): ChunkKey
export function createChunkKey(x: number, y: number): ChunkKey
export function createChunkKey(...args: [Position] | [number, number]): ChunkKey {
  if (args.length === 1) {
    return internalCreateChunkKeyFromPosition(args[0]);
  } else {
    return internalCreateChunkKeyFromCoordinates(args[0], args[1]);
  }
}

export function createEntityId(id: string | number): EntityId {
  return +id as EntityId;
}

/***** INTERNAL FUNCTIONS *****/
function internalCreateChunkKeyFromPosition(position: Position): ChunkKey {
  return `${position.x},${position.y}` as ChunkKey;
}

function internalCreateChunkKeyFromCoordinates(x: number, y: number): ChunkKey {
  return `${x},${y}` as ChunkKey;
}


