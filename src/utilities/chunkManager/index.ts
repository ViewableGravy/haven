import { Container, type ContainerChild } from "pixi.js";
import type { SubscribablePosition } from "../position/types";
import { waitForIdle } from "../promise/waitForIdle";
import type { ChunkGenerator } from "./generator";
import type { ChunkLoader } from "./loader";
import type { ChunkManagerMeta } from "./meta";

/***** CHUNK LOADER *****/
export class ChunkManager {
  /**
   * Presently, this represents all chunks that are loaded and in the game (attached to container),
   * however, in the future, this would be modified to include several chunks that are not part of the game
   * but should stay in memory in case the player turns around and needs to quickly load them into the game.
   */
  public chunks = new Map<string, ContainerChild>();
  public generationQueue: Array<string> = [];
  public processingQueue: boolean = false;
  public lastChunkPosition: { x: number; y: number } | null = null;

  constructor(
    private container: Container<ContainerChild>,
    private chunkLoaderMeta: ChunkManagerMeta,
    private chunkGenerator: ChunkGenerator,
    private chunkLoader: ChunkLoader
  ) { };

  public subscribe = (position: SubscribablePosition) => {
    position.subscribeImmediately(({ x, y }) => {
      const chunkX = Math.floor(x / this.chunkLoaderMeta.CHUNK_SIZE);
      const chunkY = Math.floor(y / this.chunkLoaderMeta.CHUNK_SIZE);

      const lastX = this.lastChunkPosition?.x ?? null;
      const lastY = this.lastChunkPosition?.y ?? null;

      // Break out early if we have not moved chunks
      if (this.lastChunkPosition && lastX === chunkX && lastY === chunkY)
        return;

      this.lastChunkPosition = { x: chunkX, y: chunkY };

      const loadRadius = this.chunkLoaderMeta.LOAD_RADIUS;
      const loadRadiusX = typeof loadRadius === 'number' ? loadRadius : loadRadius.x;
      const loadRadiusY = typeof loadRadius === 'number' ? loadRadius : loadRadius.y;

      // Load the chunk if it is not already loaded
      if (!this.isChunkLoaded(chunkX, chunkY)) {
        this.queueChunk(chunkX, chunkY);
      }

      // Queue new chunks within the load radius
      for (let i = -loadRadiusX; i <= loadRadiusX; i++) {
        for (let j = -loadRadiusY; j <= loadRadiusY; j++) {
          const checkChunkX = chunkX + i;
          const checkChunkY = chunkY + j;

          if (!this.isChunkLoaded(checkChunkX, checkChunkY)) {
            if (!this.isChunkLoading(checkChunkX, checkChunkY)) {
              this.queueChunk(checkChunkX, checkChunkY);
            }
          }
        }
      }

      // Unload chunks outside the load radius
      // TODO: Move this to a background process
      const keys = Array.from(this.chunks.keys());

      keys.forEach((key) => {
        const [existingChunkX, existingChunkY] = key.split(',').map(Number);
        if (Math.abs(existingChunkX - chunkX) > loadRadiusX || Math.abs(chunkY - existingChunkY) > loadRadiusY) {
          this.unloadChunk(existingChunkX, existingChunkY);
        }
      });

      // Process the queue if not already processing
      if (!this.processingQueue) {
        // Runs asynchronously to avoid blocking the main thread
        this.processQueue();
      }
    });
  }

  private getChunkKey = (x: number, y: number) => {
    return `${x},${y}`;
  }

  private queueChunk = (chunkX: number, chunkY: number) => {
    const chunkKey = this.getChunkKey(chunkX, chunkY);

    this.generationQueue.push(chunkKey);
  }

  private unloadChunk = (chunkX: number, chunkY: number) => {
    const chunkKey = this.getChunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(chunkKey);
    if (chunk) {
      chunk.destroy();
      this.container.removeChild(chunk);
      this.chunks.delete(chunkKey);
    }

    this.generationQueue.splice(this.generationQueue.indexOf(chunkKey), 1);
  }

  private processQueue = async () => {
    this.processingQueue = true;

    // Start processing queue
    while (this.generationQueue.length > 0) {
      const batch = this.generationQueue.splice(0, 5);

      // Load the batch with a small delay to avoid locking main thread
      await Promise.all(batch.map(async (chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);

        const chunk = await this.chunkGenerator.generateChunk(chunkX, chunkY)
        const entities = await this.chunkLoader.retrieveEntities(chunkX, chunkY);

        if (entities.length)
          chunk.addChild(...entities);

        this.chunks.set(chunkKey, chunk);
        this.container.addChild(chunk);
      }));

      // give the thread some air, nya~
      await waitForIdle();
    }

    this.processingQueue = false;
  }

  private isChunkLoaded = (chunkX: number, chunkY: number) => {
    const chunkKey = this.getChunkKey(chunkX, chunkY);
    return this.chunks.has(chunkKey);
  }

  private isChunkLoading = (chunkX: number, chunkY: number) => {
    const chunkKey = this.getChunkKey(chunkX, chunkY);
    return this.generationQueue.includes(chunkKey);
  }
}