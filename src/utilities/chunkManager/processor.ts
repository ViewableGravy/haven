import { waitForIdle } from "../promise/waitForIdle";
import { createChunkKey, type ChunkKey } from "../tagged";
import type { ChunkGenerator } from "./generator";
import type { ChunkLoader } from "./loader";

/**
 * Manages the queue and processing of chunk generation in an asynchronous, batched manner.
 * 
 * The ChunkProcessor acts as a coordinator between chunk generation requests and the actual
 * generation process. It maintains a queue of chunks that need to be generated and processes
 * them in configurable batches to avoid blocking the main thread. Each chunk goes through
 * two phases: background generation (terrain/tiles) via the ChunkGenerator, and entity
 * loading via the ChunkLoader.
 * 
 * Key responsibilities:
 * - Queue management: Prevents duplicate chunk requests and maintains processing order
 * - Batch processing: Processes multiple chunks in parallel for better performance
 * - Async coordination: Uses Promise.all for parallel generation within batches
 * - Idle yielding: Waits for idle time between batches to maintain UI responsiveness
 * - State tracking: Tracks processing status to prevent concurrent processing
 */
export class ChunkProcessor {
  private generationQueue: Array<ChunkKey> = [];
  private isProcessing: boolean = false;
  private readonly batchSize = 5;

  /**
   * Creates a new ChunkProcessor instance
   * @param chunkGenerator - Generator responsible for creating chunk content
   * @param chunkLoader - Loader responsible for retrieving entities for chunks
   */
  constructor(
    private chunkGenerator: ChunkGenerator,
    private chunkLoader: ChunkLoader
  ) {}

  /**
   * Adds a chunk to the generation queue if it's not already queued
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   */
  public queueChunk(chunkX: number, chunkY: number): void {
    const chunkKey = createChunkKey(chunkX, chunkY);
    if (!this.isChunkQueued(chunkKey)) {
      this.generationQueue.push(chunkKey);
    }
  }

  /**
   * Checks if a chunk is currently in the generation queue
   * @param chunkKey - The unique identifier for the chunk
   * @returns True if the chunk is queued, false otherwise
   */
  public isChunkQueued(chunkKey: ChunkKey): boolean {
    return this.generationQueue.includes(chunkKey);
  }

  /**
   * Removes a chunk from the generation queue
   * @param chunkKey - The unique identifier for the chunk to remove
   */
  public removeFromQueue(chunkKey: ChunkKey): void {
    const index = this.generationQueue.indexOf(chunkKey);
    if (index !== -1) {
      this.generationQueue.splice(index, 1);
    }
  }

  /**
   * Processes all chunks in the queue in batches
   * @param onChunkReady - Callback function called when each chunk is ready
   * @returns Promise that resolves when all queued chunks are processed
   */
  public async processQueue(
    onChunkReady: (result: { chunkKey: ChunkKey; chunk: any; entities: any[] }) => void
  ): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.generationQueue.length > 0) {
      const batch = this.generationQueue.splice(0, this.batchSize);

      const chunkPromises = batch.map(async (chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);
        const chunk = await this.chunkGenerator.generateChunk(chunkX, chunkY);
        const entities = await this.chunkLoader.retrieveEntities(chunkX, chunkY);
        return { chunkKey, chunk, entities };
      });

      const results = await Promise.all(chunkPromises);
      results.forEach(onChunkReady);

      await waitForIdle();
    }

    this.isProcessing = false;
  }

  /**
   * Gets whether the processor is currently processing chunks
   * @returns True if processing is in progress, false otherwise
   */
  public get isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Gets the current number of chunks in the queue
   * @returns The number of chunks waiting to be processed
   */
  public get queueLength(): number {
    return this.generationQueue.length;
  }
}