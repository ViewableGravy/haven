import { Container, Graphics, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { BaseEntity } from "../../entities/base";
import { ContainerTrait } from "../../entities/traits/container";
import { EventEmitter } from "../../utilities/eventEmitter";
import type { Game } from "../../utilities/game/game";
import { createChunkKey, type ChunkKey } from "../../utilities/tagged";
import { Chunk } from "./chunk";
import { ChunkRegistry } from "./registry";
import { TileFactory } from "./tile";
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
      this.container.removeChild(chunk.getContainer());
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
    entities: BaseEntity[]
  ): void {
    // Get chunk position for debugging
    const chunkContainer = chunk.getContainer();
    const worldPosition = chunk.getGlobalPosition();
    
    console.log(`ChunkManager: Registering chunk ${chunkKey}`);
    console.log(`  - Container position: (${chunkContainer.x}, ${chunkContainer.y})`);
    console.log(`  - World position: (${worldPosition.x}, ${worldPosition.y})`);
    console.log(`  - Container size: ${chunkContainer.width}x${chunkContainer.height}`);
    
    // Atomically register chunk and its entities
    this.chunkRegistry.addChunk(chunkKey, chunk);
    this.container.addChild(chunkContainer);

    console.log('container', this.container);
    
    console.log(`  - Added to world container (total children: ${this.container.children.length})`);
    console.log(`  - World container bounds: x=${this.container.x}, y=${this.container.y}, w=${this.container.width}, h=${this.container.height}`);
    
    // Add entities to the game
    for (const entity of entities) {
      if (ContainerTrait.is(entity)) {
        chunk.addChild(entity.containerTrait.container);
      }
      this.game.entityManager.addEntity(entity);
    }
    
    // Register entities for this chunk
    this.game.entityManager.setEntitiesForChunk(chunkKey, new Set(entities));
    
    console.log(`ChunkManager: Successfully registered chunk ${chunkKey} with ${entities.length} entities`);
  }

  public createChunkFromTiles(
    chunkX: number,
    chunkY: number,
    tiles: Array<{ color: string, x: number, y: number }>
  ): Chunk {
    console.log(`ChunkManager: Creating chunk (${chunkX}, ${chunkY}) from ${tiles.length} tiles`);
    
    // Create chunk instance
    const chunk = new Chunk(this.game, chunkX, chunkY);
    
    console.log(`ChunkManager: Chunk container created at position (${chunk.getContainer().x}, ${chunk.getContainer().y})`);
    console.log(`ChunkManager: Chunk size should be ${this.game.consts.chunkAbsolute}x${this.game.consts.chunkAbsolute} pixels`);
    
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
    
    console.log(`ChunkManager: Created ${tiles.length} tiles for chunk background`);
    
    // Optimize background rendering
    background.interactive = false;
    background.interactiveChildren = false;
    background.cacheAsTexture(true);
    
    // Add background to chunk
    chunk.addChild(background);
    
    // Create debug border (inset by 1px to avoid overlap with adjacent chunks)
    const debugBorder = new Graphics();
    debugBorder.rect(3, 3, this.game.consts.chunkAbsolute - 6, this.game.consts.chunkAbsolute - 6);
    debugBorder.stroke({ color: 0xFF0000, width: 6 });
    debugBorder.zIndex = 100; // Above background (-1) but below entities
    chunk.addChild(debugBorder);
    
    console.log(`ChunkManager: Added inset debug border to chunk (${chunkX}, ${chunkY})`);
    console.log(`ChunkManager: Chunk (${chunkX}, ${chunkY}) creation complete`);
    
    return chunk;
  }
}