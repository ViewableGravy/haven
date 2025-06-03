import type { ChunkKey } from "../../utilities/tagged";
import type { Chunk } from "./chunk";

/***** CHUNK REGISTRY *****/
/**
 * Manages the state of active chunks in memory
 */
export class ChunkRegistry {
  private activeChunkKeys: Set<ChunkKey> = new Set();
  private activeChunksByKey: Map<ChunkKey, Chunk> = new Map();

  /**
   * Adds a chunk to the registry
   * @param chunkKey - The unique identifier for the chunk
   * @param chunk - The chunk instance to register
   */
  public addChunk(chunkKey: ChunkKey, chunk: Chunk): void {
    this.activeChunkKeys.add(chunkKey);
    this.activeChunksByKey.set(chunkKey, chunk);
  }

  /**
   * Removes a chunk from the registry
   * @param chunkKey - The unique identifier for the chunk to remove
   */
  public removeChunk(chunkKey: ChunkKey): void {
    this.activeChunkKeys.delete(chunkKey);
    this.activeChunksByKey.delete(chunkKey);
  }

  /**
   * Retrieves a chunk by its key
   * @param chunkKey - The unique identifier for the chunk
   * @returns The chunk if found, undefined otherwise
   */
  public getChunk(chunkKey: ChunkKey): Chunk | undefined {
    return this.activeChunksByKey.get(chunkKey);
  }

  /**
   * Gets all active chunk keys
   * @returns Set containing all active chunk keys
   */
  public getActiveChunkKeys(): Set<ChunkKey> {
    return this.activeChunkKeys;
  }

  /**
   * Checks if a chunk is registered
   * @param chunkKey - The unique identifier for the chunk
   * @returns True if the chunk is registered, false otherwise
   */
  public hasChunk(chunkKey: ChunkKey): boolean {
    return this.activeChunkKeys.has(chunkKey);
  }

  /**
   * Clears all chunks from the registry
   */
  public clear(): void {
    this.activeChunkKeys.clear();
    this.activeChunksByKey.clear();
  }

  /**
   * Gets a copy of all chunks in the registry
   * @returns A new Map containing all chunks
   */
  public getAllChunks(): Readonly<Map<ChunkKey, Chunk>> {
    return this.activeChunksByKey;
  }
}