import type { Tagged } from "type-fest";
import type { Position } from "../position";

/***** TYPE DEFINITIONS *****/
export type ChunkKey = Tagged<string, "ChunkKey">;
export type EntityId = Tagged<number, "EntityId">;

/***** FUNCTIONS *****/
type PositionArgs = [position: Position];
type CoordinatesArgs = [x: number, y: number]; 
export function createChunkKey(...args: PositionArgs): ChunkKey
export function createChunkKey(...args: CoordinatesArgs): ChunkKey
export function createChunkKey(...args: PositionArgs | CoordinatesArgs): ChunkKey {
  if (args.length === 1) {
    return internalCreateChunkKeyFromPosition(args[0]);
  } else {
    return internalCreateChunkKeyFromCoordinates(args[0], args[1]);
  }
}

export function createEntityId(id: string | number): EntityId {
  return +id as EntityId;
}

export function parseChunkKey(chunkKey: ChunkKey): { chunkX: number; chunkY: number } {
  const [x, y] = chunkKey.split(',').map(Number);
  return { chunkX: x, chunkY: y };
}

/***** INTERNAL FUNCTIONS *****/
function internalCreateChunkKeyFromPosition(position: Position): ChunkKey {
  return `${position.x},${position.y}` as ChunkKey;
}

function internalCreateChunkKeyFromCoordinates(x: number, y: number): ChunkKey {
  return `${x},${y}` as ChunkKey;
}
