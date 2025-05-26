import { Container, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { BaseEntity } from "../../entities/base";
import { ContainerTrait } from "../../entities/traits/container";
import { EventEmitter } from "../eventEmitter";
import type { Game } from "../game/game";
import type { SubscribablePosition } from "../position/subscribable";
import { createChunkKey, type ChunkKey } from "../tagged";
import { Chunk } from "./chunk";
import type { ChunkGenerator } from "./generator";
import type { ChunkLoader } from "./loader";
import { ChunkLoadManager } from "./loadManager";
import type { ChunkManagerMeta } from "./meta";
import { ChunkProcessor } from "./processor";
import { ChunkRegistry } from "./registry";

/***** TYPE DEFINITIONS *****/
export interface ChunkLoadedEvent {
  chunkKey: ChunkKey;
  chunk: Chunk;
  entities: any[];
}

/***** SIMPLIFIED CHUNK MANAGER *****/
/**
 * Simplified ChunkManager that coordinates chunk loading/unloading
 */
export class ChunkManager extends EventEmitter<ChunkLoadedEvent> {
  private chunkRegistry = new ChunkRegistry();
  private chunkProcessor: ChunkProcessor;
  private loadManager: ChunkLoadManager;

  /**
   * Creates a new ChunkManager instance
   * @param game - The game instance containing constants and entity management
   * @param container - The PIXI.js container that will hold all chunk display objects
   * @param chunkGenerator - Generator responsible for creating chunk content
   * @param chunkLoaderMeta - Metadata configuration for chunk loading behavior
   * @param chunkLoader - Loader responsible for processing chunks
   */
  constructor(
    private game: Game,
    private container: Container<ContainerChild>,
    private chunkGenerator: ChunkGenerator,
    chunkLoaderMeta: ChunkManagerMeta,
    chunkLoader: ChunkLoader
  ) {
    super(); // Call EventEmitter constructor
    this.chunkProcessor = new ChunkProcessor(chunkGenerator, chunkLoader);
    this.loadManager = new ChunkLoadManager(game.consts.chunkAbsolute, chunkLoaderMeta);
  }

  /**
   * Subscribes a position to the chunk loading system
   * The position will be monitored and chunks will be loaded/unloaded based on proximity
   * @param position - The subscribable position that determines which chunks should be loaded
   */
  public subscribeToPosition = (position: SubscribablePosition) => {
    this.loadManager.subscribeToPosition(position, {
      onChunkNeeded: (chunkX, chunkY) => {
        this.chunkProcessor.queueChunk(chunkX, chunkY);
        this.processQueueIfNeeded();
      },
      onChunkUnneeded: (chunkKey) => this.unloadChunk(chunkKey),
      isChunkLoaded: (chunkX, chunkY) => this.isChunkLoaded(chunkX, chunkY),
      isChunkQueued: (chunkX, chunkY) => this.isChunkQueued(chunkX, chunkY),
      getActiveChunkKeys: () => this.chunkRegistry.getActiveChunkKeys()
    });
  };

  /**
   * Retrieves the chunk containing the specified world coordinates
   * @param x - World x coordinate
   * @param y - World y coordinate
   * @returns The chunk containing the specified coordinates
   * @throws {Error} If the chunk is not found (chunk must be loaded first)
   */
  public getChunk = (x: number, y: number): Chunk => {
    const chunkX = Math.floor(x / this.game.consts.chunkAbsolute);
    const chunkY = Math.floor(y / this.game.consts.chunkAbsolute);
    const chunkKey = createChunkKey(chunkX, chunkY);
    const chunk = this.chunkRegistry.getChunk(chunkKey);

    invariant(chunk, `Chunk not found: ${chunkKey}`);
    return chunk;
  };

  /**
   * Cleans up resources and destroys the chunk manager
   * This will destroy the chunk generator and clear all registered chunks
   */
  public destroy(): void {
    this.chunkGenerator?.destroy();
    this.chunkRegistry.clear();
  }

  /**
   * Processes the chunk queue if no processing is currently in progress
   * This is an async operation that loads chunks from the queue
   */
  private async processQueueIfNeeded(): Promise<void> {
    if (!this.chunkProcessor.isCurrentlyProcessing) {
      await this.chunkProcessor.processQueue(({ chunkKey, chunk, entities }) => {
        this.addChunkToGame(chunkKey, chunk, entities);
      });
    }
  }

  /**
   * Adds a processed chunk and its entities to the game world
   * @param chunkKey - The unique identifier for the chunk
   * @param chunk - The chunk instance to add to the container
   * @param entities - Array of entities that belong to this chunk
   */
  private addChunkToGame(chunkKey: ChunkKey, chunk: Chunk, entities: BaseEntity[]): void {
    console.log(`ChunkManager: Adding chunk ${chunkKey} to game with ${entities.length} entities`);

    // Add entities to chunk
    if (entities.length) {
      entities.forEach((entity, index) => {
        console.log(`ChunkManager: Adding entity ${index} to chunk ${chunkKey}:`, entity);
        if (ContainerTrait.is(entity)) {
          chunk.addChild(entity.containerTrait.container);
          console.log(`ChunkManager: Added entity container to chunk`);
        } else {
          console.warn(`ChunkManager: Entity ${index} does not have a container`);
        }
        this.game.entityManager.addEntity(entity);
      });
    } else {
      console.log(`ChunkManager: No entities to add for chunk ${chunkKey}`);
    }

    // Register chunk and entities
    this.game.entityManager.setEntitiesForChunk(chunkKey, new Set(entities));
    this.chunkRegistry.addChunk(chunkKey, chunk);
    this.container.addChild(chunk.getContainer());

    // Emit chunk loaded event for subscribers (like EntitySyncManager)
    this.emit({
      chunkKey,
      chunk,
      entities
    });

    console.log(`ChunkManager: Chunk ${chunkKey} loaded event emitted`);
  }

  /**
   * Unloads and removes a chunk from the game world
   * This destroys the chunk, removes it from the container, and cleans up associated entities
   * @param chunkKey - The unique identifier for the chunk to unload
   */
  private unloadChunk(chunkKey: ChunkKey): void {
    const chunk = this.chunkRegistry.getChunk(chunkKey);
    if (chunk) {
      this.container.removeChild(chunk.getContainer());
      chunk.destroy();
      this.chunkRegistry.removeChunk(chunkKey);
      this.game.entityManager.removeEntitiesForChunk(chunkKey);
    }
    this.chunkProcessor.removeFromQueue(chunkKey);
  }

  /**
   * Checks if a chunk at the specified coordinates is currently loaded
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns True if the chunk is loaded, false otherwise
   */
  private isChunkLoaded(chunkX: number, chunkY: number): boolean {
    return this.chunkRegistry.hasChunk(createChunkKey(chunkX, chunkY));
  }

  /**
   * Checks if a chunk at the specified coordinates is currently queued for loading
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns True if the chunk is in the processing queue, false otherwise
   */
  private isChunkQueued(chunkX: number, chunkY: number): boolean {
    return this.chunkProcessor.isChunkQueued(createChunkKey(chunkX, chunkY));
  }
}