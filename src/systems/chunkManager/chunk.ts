import { Container, Rectangle, RenderTexture, Sprite, type ContainerChild } from "pixi.js";
import invariant from "tiny-invariant";
import type { Game } from "../../utilities/game/game";
import { Logger } from "../../utilities/logger";
import { Position } from "../../utilities/position";
import { globalRenderTexturePool } from "./renderTexturePool";

/***** TYPE DEFINITIONS *****/
export interface ChunkPosition {
  x: number;
  y: number;
}

/***** CHUNK CLASS *****/
export class Chunk {
  private container: Container<ContainerChild>;
  private chunkPosition: Position;
  private game: Game;

  constructor(game: Game, chunkX: number, chunkY: number) {
    this.game = game;
    // Fix: Use "chunk" type instead of "local" for chunk coordinates
    this.chunkPosition = new Position(chunkX, chunkY, "chunk" as any);
    
    // Create the underlying container
    this.container = new Container();
    
    // Set container properties
    const size = this.game.consts.chunkAbsolute;
    
    // Calculate world position for this chunk
    const worldX = chunkX * size;
    const worldY = chunkY * size;
    
    this.container.x = worldX;
    this.container.y = worldY;
    this.container.width = size;
    this.container.height = size;
    this.container.boundsArea = new Rectangle(0, 0, size, size);
    this.container.zIndex = 0;
    this.container.sortableChildren = true;
    
    Logger.log(`Chunk (${chunkX}, ${chunkY}): Container positioned at world coordinates (${worldX}, ${worldY}), size: ${size}x${size}`);
  }

  /**
   * Converts a global position to a local position within this chunk
   * @param globalPosition - The global position to convert
   * @returns Local position within the chunk
   * @throws Error if the position is not global or is outside this chunk
   */
  public toLocalPosition(globalPosition: Position): { x: number; y: number } {
    invariant(
      globalPosition.type === "global", 
      "Position must be global to convert to local chunk position"
    );

    const chunkSize = this.game.consts.chunkAbsolute;
    
    // Calculate which chunk this global position belongs to
    const expectedChunkX = Math.floor(globalPosition.x / chunkSize);
    const expectedChunkY = Math.floor(globalPosition.y / chunkSize);
    
    // Verify the position belongs to this chunk
    invariant(
      expectedChunkX === this.chunkPosition.x && expectedChunkY === this.chunkPosition.y,
      `Global position (${globalPosition.x}, ${globalPosition.y}) does not belong to chunk (${this.chunkPosition.x}, ${this.chunkPosition.y})`
    );

    // Convert to local position
    const localX = globalPosition.x - (this.chunkPosition.x * chunkSize);
    const localY = globalPosition.y - (this.chunkPosition.y * chunkSize);

    return { x: localX, y: localY };
  }

  /**
   * Gets the global position of this chunk's top-left corner
   */
  public getGlobalPosition(): { x: number; y: number } {
    const size = this.game.consts.chunkAbsolute;
    return {
      x: this.chunkPosition.x * size,
      y: this.chunkPosition.y * size
    };
  }

  /**
   * Gets the chunk coordinates
   */
  public getChunkPosition(): ChunkPosition {
    return { ...this.chunkPosition };
  }

  /**
   * Adds a child to the chunk container
   */
  public addChild(child: ContainerChild): void {
    this.container.addChild(child);
  }

  /**
   * Removes a child from the chunk container
   */
  public removeChild(child: ContainerChild): void {
    this.container.removeChild(child);
  }

  /**
   * Gets the underlying PIXI container
   */
  public getContainer(): Container<ContainerChild> {
    return this.container;
  }

  /**
   * Destroys the chunk and its container
   */
  public destroy(): void {
    // Extract and return render textures to pool before destroying
    this.returnRenderTexturesToPool();
    
    // Recursively destroy children and their textures
    this.container.destroy({ 
      children: true, 
      texture: true
    });
  }

  /***** RENDER TEXTURE POOL MANAGEMENT *****/
  /**
   * Finds and returns RenderTextures to the pool before chunk destruction
   */
  private returnRenderTexturesToPool(): void {
    // Walk through all children to find sprites with RenderTextures
    this.container.children.forEach((child) => {
      if (child instanceof Sprite && child.texture instanceof RenderTexture) {
        const renderTexture = child.texture;
        
        // Remove the texture from the sprite to prevent it from being destroyed
        child.texture = null as any; // Temporarily null to prevent destruction
        
        // Return the render texture to the pool
        globalRenderTexturePool.returnTexture(renderTexture);
        
        Logger.log("Chunk: Returned RenderTexture to pool during destruction");
      }
    });
  }
}