import { Container, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { Game } from "../game/game";
import type { SubscribablePosition } from "../position/subscribable";
import { waitForIdle } from "../promise/waitForIdle";
import { createChunkKey, type ChunkKey } from "../tagged";
import type { ChunkGenerator } from "./generator";
import type { ChunkLoader } from "./loader";
import type { ChunkManagerMeta } from "./meta";

/***** CHUNK MANAGER *****/
export class ChunkManager {
  /**
   * Represents all chunks that are loaded and in the game (attached to container).
   * In the future, this could include chunks that stay in memory for quick loading.
   */
  public generationQueue: Array<ChunkKey> = [];
  public processingQueue: boolean = false;
  public lastChunkPosition: { x: number; y: number } | null = null;

  constructor(
    private game: Game,
    private container: Container<ContainerChild>,
    private chunkLoaderMeta: ChunkManagerMeta,
    private chunkGenerator: ChunkGenerator,
    private chunkLoader: ChunkLoader
  ) { };

  public subscribe = (position: SubscribablePosition) => {
    position.subscribeImmediately(({ x, y }) => {
      const chunkX = Math.floor(x / this.game.consts.chunkAbsolute);
      const chunkY = Math.floor(y / this.game.consts.chunkAbsolute);

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
        if (!this.isChunkLoading(chunkX, chunkY)) {
          this.queueChunk(chunkX, chunkY);
        }
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
      this.game.getActiveChunkKeys().forEach((chunkKey) => {
        const [existingChunkX, existingChunkY] = chunkKey.split(',').map(Number);
        if (Math.abs(existingChunkX - chunkX) > loadRadiusX || Math.abs(chunkY - existingChunkY) > loadRadiusY) {
          this.unloadChunk(existingChunkX, existingChunkY);
        }
      });

      // Process the queue if not already processing
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  };

  public getChunk = (x: number, y: number) => {
    const chunkX = Math.floor(x / this.game.consts.chunkAbsolute);
    const chunkY = Math.floor(y / this.game.consts.chunkAbsolute);

    const chunkKey = createChunkKey(chunkX, chunkY);
    const chunk = this.game.getActiveChunk(chunkKey);

    invariant(chunk, `Chunk not found: ${chunkKey}`);

    return chunk;
  }

  private queueChunk = (chunkX: number, chunkY: number) => {
    this.generationQueue.push(createChunkKey(chunkX, chunkY));
  };

  private unloadChunk = (chunkX: number, chunkY: number) => {
    const chunkKey = createChunkKey(chunkX, chunkY);
    const chunk = this.game.getActiveChunk(chunkKey);
    if (chunk) {
      chunk.destroy();
      this.container.removeChild(chunk);
      this.game.removeActiveChunk(chunkKey);
    }

    this.generationQueue.splice(this.generationQueue.indexOf(chunkKey), 1);
  }

  private processQueue = async () => {
    this.processingQueue = true;

    const batchSize = 5;

    while (this.generationQueue.length > 0) {
      const batch = this.generationQueue.splice(0, batchSize);

      const chunkPromises = batch.map(async (chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);

        const chunk = await this.chunkGenerator.generateChunk(chunkX, chunkY);
        const entities = await this.chunkLoader.retrieveEntities(chunkX, chunkY);

        return { chunkKey, chunk, entities };
      });

      const results = await Promise.all(chunkPromises);

      for (const { chunkKey, chunk, entities } of results) {
        // Add entities to the chunk if any exist
        if (entities.length) {
          for (const entity of entities) {
            if (entity.hasContainer()) {
              chunk.addChild(entity.container);
            }
          }
          entities.forEach((e) => this.game.addEntity(e));
        }
        
        // Register chunk and entities in the game state
        this.game.setEntitiesForChunk(chunkKey, new Set(entities));
        this.game.addActiveChunk(chunkKey, chunk);

        // Add the chunk to the display container
        this.container.addChild(chunk);
      }

      await waitForIdle();
    }

    this.processingQueue = false;
  }

  private isChunkLoaded = (chunkX: number, chunkY: number) => {
    return this.game.getActiveChunk(createChunkKey(chunkX, chunkY)) !== undefined;
  }

  private isChunkLoading = (chunkX: number, chunkY: number) => {
    return this.generationQueue.includes(createChunkKey(chunkX, chunkY));
  }
}