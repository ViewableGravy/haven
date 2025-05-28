import { Container, Graphics, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { BaseEntity } from "../../entities/base";
import { ContainerTrait } from "../../entities/traits/container";
import { Chunk } from "../../utilities/chunkManager/chunk";
import type { ChunkGenerator } from "../../utilities/chunkManager/generator";
import type { ChunkLoader } from "../../utilities/chunkManager/loader";
import { ChunkLoadManager } from "../../utilities/chunkManager/loadManager";
import type { ChunkManagerMeta } from "../../utilities/chunkManager/meta";
import { ChunkProcessor } from "../../utilities/chunkManager/processor";
import { ChunkRegistry } from "../../utilities/chunkManager/registry";
import { TileFactory } from "../../utilities/chunkManager/tile";
import { EventEmitter } from "../../utilities/eventEmitter";
import type { Game } from "../../utilities/game/game";
import type { SubscribablePosition } from "../../utilities/position/subscribable";
import { createChunkKey, type ChunkKey } from "../../utilities/tagged";

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

    /**
     * We should no longer need to do this, instead the server can send events for the client to create.
     */

    return;

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

  /***** SERVER CHUNK CREATION *****/
  public registerChunkWithEntities(
    chunkKey: ChunkKey, 
    chunk: Chunk, 
    entities: BaseEntity[]
  ): void {
    // Atomically register chunk and its entities
    this.chunkRegistry.addChunk(chunkKey, chunk);
    this.container.addChild(chunk.getContainer());
    
    // Add entities to the game
    for (const entity of entities) {
      if (ContainerTrait.is(entity)) {
        chunk.addChild(entity.containerTrait.container);
      }
      this.game.entityManager.addEntity(entity);
    }
    
    // TODO: consolidate .addEntitiy and .setEntitiesForchunk - these do the same thing, we should take the
    // entities position, determine chunk and add it to chunk during the addEntity phase (or throw an error if chunk doesn't exist)

    // Register entities for this chunk
    this.game.entityManager.setEntitiesForChunk(chunkKey, new Set(entities));
  }

  public createChunkFromTiles(
    chunkX: number,
    chunkY: number,
    tiles: Array<{ color: string, x: number, y: number }>
  ): Chunk {
    // Create chunk instance
    const chunk = new Chunk(this.game, chunkX, chunkY);
    
    // Create background container for tiles
    const background = new Container();
    background.x = 0;
    background.y = 0;
    background.zIndex = -1;
    background.sortableChildren = true;
    
    // Create tile factory
    const tileTexture = this.game.state.app.renderer.generateTexture(
      new Graphics().rect(0, 0, this.game.consts.tileSize, this.game.consts.tileSize).fill(0xFFFFFF)
    );
    const tileFactory = new TileFactory(tileTexture, this.game);
    
    // Create tiles from server data
    tiles.forEach(tileData => {
      const tile = tileFactory.createPrimitive({
        x: tileData.x,
        y: tileData.y,
        tint: parseInt(tileData.color, 16)
      });
      background.addChild(tile);
    });
    
    // Optimize background rendering
    background.interactive = false;
    background.interactiveChildren = false;
    background.cacheAsTexture(true);
    
    // Add background to chunk
    chunk.addChild(background);
    
    return chunk;
  }

  /***** SERVER INTEGRATION UTILITIES *****/
  public shouldLoadChunk(chunkX: number, chunkY: number): boolean {
    // Check if this chunk is currently needed based on player position
    // This is a simplified implementation - could be enhanced with load radius checks
    return !this.isChunkLoaded(chunkX, chunkY) && !this.isChunkQueued(chunkX, chunkY);
  }
}