import { Container, type ContainerChild } from "pixi.js";
import type { SubscribablePosition } from "../position/types";
import type { ChunkGenerator } from "./generator";
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
  public processingCount: number = 0;
  public lastChunkPosition: { x: number; y: number } | null = null;

  constructor(
    private container: Container<ContainerChild>, 
    private chunkLoaderMeta: ChunkManagerMeta,
    private chunkGenerator: ChunkGenerator
  ) {};

  public subscribe = (position: SubscribablePosition) => {
    this.startBackgroundProcessing();

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
      })
    });
  }

  private getChunkKey = (x: number, y: number) => {
    return `${x},${y}`;
  }

  private queueChunk = (chunkX: number, chunkY: number) => {
    const chunkKey = this.getChunkKey(chunkX, chunkY);

    if (!this.isChunkLoaded(chunkX, chunkY)) {
      if (!this.isChunkLoading(chunkX, chunkY)) {
        this.generationQueue.push(chunkKey);
      }
    }
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

  private startBackgroundProcessing = () => {
    setInterval(async () => {
      // Process the generation queue
      for (let i = this.processingCount; i < 5; i++) {
        if (!this.generationQueue.length) {
          break;
        }

        const chunkKey = this.generationQueue.shift();
        if (chunkKey) {
          const [chunkX, chunkY] = chunkKey.split(',').map(Number);
          this.processingCount++;
          this.chunkGenerator.generateChunk(chunkX, chunkY).then((chunk) => {
            this.chunks.set(chunkKey, chunk);
            this.container.addChild(chunk);
            this.processingCount--;
          });
        }
      }
    }, 100);
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