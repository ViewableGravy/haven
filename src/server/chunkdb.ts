/***** TYPE DEFINITIONS *****/
import { Logger } from "../utilities/logger";
import type { ChunkKey } from "../utilities/tagged";
import type { EntityData } from "./types";
import type { LoadChunkEvent } from "./types/events/load_chunk";

/***** SERVER CHUNK OBJECT *****/
export interface ServerChunkObject {
  chunkKey: ChunkKey;
  chunkX: number;
  chunkY: number;
  tiles: Array<LoadChunkEvent.Tile>;
  entities: Array<EntityData>;
  generatedAt: number; // timestamp
}

/***** CHUNK DATABASE *****/
export class ChunkDatabase {
  private chunks: Map<ChunkKey, ServerChunkObject> = new Map();

  constructor() {}

  /***** MEMORY MANAGEMENT *****/
  public clear(): void {
    this.chunks.clear();
  }

  public shutdown(): void {
    this.clear();
  }  
  
  /**
   * Store a chunk in the database
   * @param chunkKey - The unique identifier for the chunk
   * @param chunkData - The chunk data to store
   */
  public storeChunk(chunkKey: ChunkKey, chunkData: ServerChunkObject): void {
    this.chunks.set(chunkKey, chunkData);
  }

  /**
   * Retrieve a chunk from the database
   * @param chunkKey - The unique identifier for the chunk
   * @returns The chunk data if found, undefined otherwise
   */
  public getChunk(chunkKey: ChunkKey): ServerChunkObject | undefined {
    return this.chunks.get(chunkKey);
  }

  /**
   * Check if a chunk exists in the database
   * @param chunkKey - The unique identifier for the chunk
   * @returns True if the chunk exists, false otherwise
   */
  public hasChunk(chunkKey: ChunkKey): boolean {
    return this.chunks.has(chunkKey);
  }  
  
  /**
   * Add an entity to an existing chunk
   * @param chunkKey - The unique identifier for the chunk
   * @param entity - The entity to add
   * @returns True if added successfully, false if chunk doesn't exist
   */
  public addEntityToChunk(chunkKey: ChunkKey, entity: EntityData): boolean {
    const chunk = this.chunks.get(chunkKey);
    if (chunk) {
      chunk.entities.push(entity);
      return true;
    }
    return false;
  }  
  
  /**
   * Remove an entity from a chunk
   * @param chunkKey - The unique identifier for the chunk
   * @param entityId - The ID of the entity to remove
   * @returns True if removed successfully, false if chunk or entity doesn't exist
   */
  public removeEntityFromChunk(chunkKey: ChunkKey, entityId: string): boolean {
    const chunk = this.chunks.get(chunkKey);
    
    if (chunk) {
      const initialLength = chunk.entities.length;
      chunk.entities = chunk.entities.filter((entity) => entity.id !== entityId);
      const removed = chunk.entities.length < initialLength;
      if (removed) {
      }
      return removed;
    }

    return false;
  }

  /**
   * Get all chunk keys currently stored
   * @returns Array of all chunk keys
   */
  public getAllChunkKeys(): Array<ChunkKey> {
    return Array.from(this.chunks.keys());
  }

  /**
   * Get statistics about the database
   * @returns Object containing database statistics
   */
  public getStats(): { chunkCount: number; totalEntities: number } {
    const chunkCount = this.chunks.size;
    const totalEntities = Array.from(this.chunks.values())
      .reduce((sum, chunk) => sum + chunk.entities.length, 0);
    
    return { chunkCount, totalEntities };
  }

  /**
   * Debug method to list all chunks currently in memory
   */
  public debugListChunks(): void {
    for (const [chunkKey, chunkData] of this.chunks) {
      chunkData.entities.forEach((_, index) => {
        Logger.log(`Chunk: ${chunkKey}, Entity ${index + 1}:`)
      });
    }
  }
}

/***** SINGLETON INSTANCE *****/
export const chunkDatabase = new ChunkDatabase();