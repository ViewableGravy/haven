import type { SubscribablePosition } from "../position/subscribable";
import { type ChunkKey } from "../tagged";
import type { ChunkManagerMeta } from "./meta";

/**
 * Handles position changes and determines which chunks should be loaded/unloaded
 */
export class ChunkLoadManager {
  private lastChunkPosition: { x: number; y: number } | null = null;

  /**
   * Creates a new ChunkLoadManager instance
   * @param chunkSize - The size of each chunk in world units
   * @param meta - Configuration metadata containing load radius settings
   */
  constructor(
    private chunkSize: number,
    private meta: ChunkManagerMeta
  ) { }

  /**
   * Subscribes to position changes and manages chunk loading/unloading
   * @param position - The subscribable position to monitor
   * @param callbacks - Object containing callback functions for chunk management
   * @param callbacks.onChunkNeeded - Called when a chunk needs to be loaded
   * @param callbacks.onChunkUnneeded - Called when a chunk should be unloaded
   * @param callbacks.isChunkLoaded - Function to check if a chunk is already loaded
   * @param callbacks.isChunkQueued - Function to check if a chunk is queued for loading
   * @param callbacks.getActiveChunkKeys - Function to get all currently active chunk keys
   */
  public subscribeToPosition(
    position: SubscribablePosition,
    callbacks: {
      onChunkNeeded: (chunkX: number, chunkY: number) => void;
      onChunkUnneeded: (chunkKey: ChunkKey) => void;
      isChunkLoaded: (chunkX: number, chunkY: number) => boolean;
      isChunkQueued: (chunkX: number, chunkY: number) => boolean;
      getActiveChunkKeys: () => Set<ChunkKey>;
    }
  ): void {
    position.subscribeImmediately(({ x, y }) => {
      const chunkX = Math.floor(x / this.chunkSize);
      const chunkY = Math.floor(y / this.chunkSize);

      // Skip if we haven't moved chunks
      if (this.lastChunkPosition?.x === chunkX && this.lastChunkPosition?.y === chunkY) {
        return;
      }

      this.lastChunkPosition = { x: chunkX, y: chunkY };
      console.log(`ChunkLoadManager: Moving to new chunk (${chunkX}, ${chunkY})`);

      const loadRadius = this.meta.LOAD_RADIUS;
      const loadRadiusX = typeof loadRadius === 'number' ? loadRadius : loadRadius.x;
      const loadRadiusY = typeof loadRadius === 'number' ? loadRadius : loadRadius.y;

      console.log(`ChunkLoadManager: Load radius: x=${loadRadiusX}, y=${loadRadiusY}`);

      // Queue chunks within load radius
      this.queueChunksInRadius(chunkX, chunkY, loadRadiusX, loadRadiusY, callbacks);

      // Unload chunks outside load radius
      this.unloadChunksOutsideRadius(chunkX, chunkY, loadRadiusX, loadRadiusY, callbacks);
    });
  }

  /**
   * Queues chunks within the specified radius for loading
   * @private
   * @param centerX - The center chunk x coordinate
   * @param centerY - The center chunk y coordinate
   * @param radiusX - The horizontal load radius in chunks
   * @param radiusY - The vertical load radius in chunks
   * @param callbacks - Callback functions for chunk state checking and loading
   */
  private queueChunksInRadius(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    callbacks: {
      onChunkNeeded: (chunkX: number, chunkY: number) => void;
      isChunkLoaded: (chunkX: number, chunkY: number) => boolean;
      isChunkQueued: (chunkX: number, chunkY: number) => boolean;
    }
  ): void {
    console.log(`ChunkLoadManager: Queueing chunks in radius (${centerX}, ${centerY}) with radius x=${radiusX}, y=${radiusY}`);

    for (let i = -radiusX; i <= radiusX; i++) {
      for (let j = -radiusY; j <= radiusY; j++) {
        const chunkX = centerX + i;
        const chunkY = centerY + j;

        if (!callbacks.isChunkLoaded(chunkX, chunkY) && !callbacks.isChunkQueued(chunkX, chunkY)) {
          console.log(`ChunkLoadManager: Queueing chunk (${chunkX}, ${chunkY})`);
          callbacks.onChunkNeeded(chunkX, chunkY);
        } else {
          console.log(`ChunkLoadManager: Chunk (${chunkX}, ${chunkY}) already loaded or queued`);
        }
      }
    }
  }

  /**
   * Unloads chunks that are outside the specified radius
   * @private
   * @param centerX - The center chunk x coordinate
   * @param centerY - The center chunk y coordinate
   * @param radiusX - The horizontal load radius in chunks
   * @param radiusY - The vertical load radius in chunks
   * @param callbacks - Callback functions for chunk unloading and state retrieval
   */
  private unloadChunksOutsideRadius(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    callbacks: {
      onChunkUnneeded: (chunkKey: ChunkKey) => void;
      getActiveChunkKeys: () => Set<ChunkKey>;
    }
  ): void {
    callbacks.getActiveChunkKeys().forEach((chunkKey) => {
      const [chunkX, chunkY] = chunkKey.split(',').map(Number);
      if (
        Math.abs(chunkX - centerX) > radiusX ||
        Math.abs(chunkY - centerY) > radiusY
      ) {
        callbacks.onChunkUnneeded(chunkKey);
      }
    });
  }
}