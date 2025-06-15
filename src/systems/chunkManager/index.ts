import { Container, Graphics, Sprite, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { GameObject } from "../../objects/base";
import type { LoadChunkEvent } from "../../server/types/events/load_chunk";
import { EventEmitter } from "../../utilities/eventEmitter";
import type { Game } from "../../utilities/game/game";
import { Logger } from "../../utilities/Logger";
import { createChunkKey, type ChunkKey } from "../../utilities/tagged";
import { Chunk } from "./chunk";
import { ChunkRegistry } from "./registry";
import { ChunkTextureBuilder } from "./textureBuilder";
import { ChunkUnloadingManager } from "./unloadingManager";

/***** TYPE DEFINITIONS *****/
export interface ChunkLoadedEvent {
  chunkKey: ChunkKey;
  chunk: Chunk;
  entities: any[];
}

/***** CHUNK MANAGER *****/
/**
 * Simplified ChunkManager for server-driven chunk loading
 */
export class ChunkManager extends EventEmitter<ChunkLoadedEvent> {
  private chunkRegistry = new ChunkRegistry();
  private unloadingManager: ChunkUnloadingManager;
  private chunkTextureBuilder: ChunkTextureBuilder;

  /**
   * Creates a new ChunkManager instance
   * @param game - The game instance containing constants and entity management
   * @param container - The PIXI.js container that will hold all chunk display objects
   */
  constructor(
    private game: Game,
    private container: Container<ContainerChild>
  ) {
    super(); // Call EventEmitter constructor
    
    // Initialize the chunk unloading manager
    this.unloadingManager = new ChunkUnloadingManager(this.game, this);
    this.chunkTextureBuilder = new ChunkTextureBuilder(this.game.state.app.renderer);
  }

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
   * Retrieves a chunk by its unique key
   * @param chunkKey - The unique identifier for the chunk
   * @returns The chunk associated with the specified key
   * @throws {Error} If the chunk is not found
   */
  public getChunkByKey = (chunkKey: ChunkKey): Chunk => {
    const chunk = this.chunkRegistry.getChunk(chunkKey);
    invariant(chunk, `Chunk not found: ${chunkKey}`);
    return chunk;
  };

  /**
   * Initialize the chunk unloading system
   * This should be called after multiplayer is set up
   */
  public initializeUnloading(): void {
    this.unloadingManager.initialize();
  }

  /**
   * Cleans up resources and destroys the chunk manager
   * This will clear all registered chunks
   */
  public destroy(): void {
    this.unloadingManager.destroy();
    this.chunkRegistry.clear();
  }

  /**
   * Unloads and removes a chunk from the game world
   * This destroys the chunk, removes it from the container, and cleans up associated entities
   * @param chunkKey - The unique identifier for the chunk to unload
   */  
  
  public unloadChunk(chunkKey: ChunkKey): void {
    const chunk = this.chunkRegistry.getChunk(chunkKey);
    if (chunk) {
      // Notify EntitySyncManager before cleanup so it can remove entity references
      this.game.controllers.multiplayer?.entitySync?.handleChunkUnload?.(chunkKey);
      
      // Remove from layer system
      const layerManager = this.game.worldManager.getLayerManager();
      layerManager.removeFromLayer(chunk.getContainer());
      
      chunk.destroy();
      this.chunkRegistry.removeChunk(chunkKey);
      this.game.entityManager.removeEntitiesForChunk(chunkKey);
    }
  }

  /**
   * Checks if a chunk at the specified coordinates is currently loaded
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns True if the chunk is loaded, false otherwise
   */
  public isChunkLoaded(chunkX: number, chunkY: number): boolean {
    return this.chunkRegistry.hasChunk(createChunkKey(chunkX, chunkY));
  }

  /***** SERVER CHUNK CREATION *****/
  public registerChunkWithEntities(
    chunkKey: ChunkKey, 
    chunk: Chunk, 
    entities: GameObject[]
  ): void {
    // Get chunk position for debugging
    const chunkContainer = chunk.getContainer();
    const worldPosition = chunk.getGlobalPosition();
    
    Logger.log(`ChunkManager: Registering chunk ${chunkKey}`);
    Logger.log(`  - Container position: (${chunkContainer.x}, ${chunkContainer.y})`);
    Logger.log(`  - World position: (${worldPosition.x}, ${worldPosition.y})`);
    Logger.log(`  - Container size: ${chunkContainer.width}x${chunkContainer.height}`);
      // Register chunk (terrain only) - add to background layer
    this.chunkRegistry.addChunk(chunkKey, chunk);
    const layerManager = this.game.worldManager.getLayerManager();
    layerManager.addToLayer(chunkContainer, 'background');
    
    Logger.log(`  - Added to world container (total children: ${this.container.children.length})`);
    Logger.log(`  - World container bounds: x=${this.container.x}, y=${this.container.y}, w=${this.container.width}, h=${this.container.height}`);
    
    // Entities are now handled by EntityManager and placed on main stage
    // Just add them to entity tracking without adding to chunk containers
    for (const entity of entities) {
      this.game.entityManager.addEntity(entity);
    }
    
    // Register entities for this chunk (for cleanup tracking)
    this.game.entityManager.setEntitiesForChunk(chunkKey, new Set(entities));
    
    Logger.log(`ChunkManager: Successfully registered chunk ${chunkKey} with ${entities.length} entities`);
  }

  public createChunkFromTiles(
    chunkX: number,
    chunkY: number,
    tiles: Array<LoadChunkEvent.Tile>
  ): Chunk {
    Logger.log(`ChunkManager: Creating chunk (${chunkX}, ${chunkY}) from ${tiles.length} tiles`);
    
    // Create chunk instance
    const chunk = new Chunk(this.game, chunkX, chunkY);
    
    Logger.log(`ChunkManager: Chunk container created at position (${chunk.getContainer().x}, ${chunk.getContainer().y})`);
    Logger.log(`ChunkManager: Chunk size should be ${this.game.consts.chunkAbsolute}x${this.game.consts.chunkAbsolute} pixels`);
    
    // Generate background texture efficiently
    const backgroundTexture = this.chunkTextureBuilder.createChunkBackgroundTexture(tiles);
    
    // Create single sprite from the generated texture
    const backgroundSprite = new Sprite(backgroundTexture);
    backgroundSprite.x = 0;
    backgroundSprite.y = 0;
    backgroundSprite.zIndex = -1;
    
    // Add background sprite to chunk
    chunk.addChild(backgroundSprite);
    
    Logger.log(`ChunkManager: Created optimized background texture for chunk (${chunkX}, ${chunkY})`);
    
    // Create debug border (inset by 1px to avoid overlap with adjacent chunks)
    const debugBorder = new Graphics();
    debugBorder.rect(3, 3, this.game.consts.chunkAbsolute - 6, this.game.consts.chunkAbsolute - 6);
    debugBorder.stroke({ color: 0xFF0000, width: 6 });
    debugBorder.zIndex = 100; // Above background (-1) but below entities
    chunk.addChild(debugBorder);
    
    Logger.log(`ChunkManager: Added inset debug border to chunk (${chunkX}, ${chunkY})`);
    Logger.log(`ChunkManager: Chunk (${chunkX}, ${chunkY}) creation complete`);
    
    return chunk;
  }
}