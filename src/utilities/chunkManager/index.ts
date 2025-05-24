import { Container, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { SubscribablePosition } from "../position/subscribable";
import { waitForIdle } from "../promise/waitForIdle";
import { store } from "../store";
import { createChunkKey, type ChunkKey } from "../tagged";
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
  public generationQueue: Array<ChunkKey> = [];
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
      const chunkX = Math.floor(x / store.consts.chunkAbsolute);
      const chunkY = Math.floor(y / store.consts.chunkAbsolute);

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
      store.activeChunkKeys.forEach((chunkKey) => {
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
    const chunkX = Math.floor(x / store.consts.chunkAbsolute);
    const chunkY = Math.floor(y / store.consts.chunkAbsolute);

    const chunkKey = createChunkKey(chunkX, chunkY);
    const chunk = store.activeChunksByKey.get(chunkKey);

    invariant(chunk, `Chunk not found: ${chunkKey}`);

    return chunk;
  }

  private queueChunk = (chunkX: number, chunkY: number) => {
    this.generationQueue.push(createChunkKey(chunkX, chunkY));
  };

  private unloadChunk = (chunkX: number, chunkY: number) => {
    const chunkKey = createChunkKey(chunkX, chunkY);
    const chunk = store.activeChunksByKey.get(chunkKey);
    if (chunk) {
      chunk.destroy();
      this.container.removeChild(chunk);
      store.activeChunkKeys.delete(chunkKey);
      store.activeChunksByKey.delete(chunkKey);
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

        // If there are entities, add them to the scene and entities set
        if (entities.length) {
          for (const entity of entities) {
            if (entity.hasContainer()) {
              chunk.addChild(entity.container);
            }
          }
          entities.forEach((e) => store.entities.add(e));
        }
        
        // Set this chunk and entities in the store
        store.entitiesByChunk.set(chunkKey, new Set(entities));
        store.activeChunkKeys.add(chunkKey);
        store.activeChunksByKey.set(chunkKey, chunk);

        // Add the chunk to the container
        this.container.addChild(chunk);
      }));

      // give the thread some air, nya~
      await waitForIdle();
    }

    this.processingQueue = false;
  }

  private isChunkLoaded = (chunkX: number, chunkY: number) => {
    return store.activeChunksByKey.has(createChunkKey(chunkX, chunkY));
  }

  private isChunkLoading = (chunkX: number, chunkY: number) => {
    return this.generationQueue.includes(createChunkKey(chunkX, chunkY));
  }
}