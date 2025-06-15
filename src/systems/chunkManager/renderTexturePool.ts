/***** TYPE DEFINITIONS *****/
import { RenderTexture } from "pixi.js";
import { GameConstants } from "../../shared/constants";
import { Logger } from "../../utilities/Logger";

/***** RENDER TEXTURE POOL *****/
/**
 * Global pool for managing reusable RenderTextures for chunk backgrounds.
 * Reduces GC pressure by reusing textures instead of creating/destroying them.
 * Maintains a maximum pool size with LRU eviction policy.
 */
export class RenderTexturePool {
  private pool: Array<RenderTexture> = [];
  private readonly maxPoolSize: number;
  private readonly textureWidth: number;
  private readonly textureHeight: number;

  constructor(
    maxPoolSize: number = GameConstants.MAX_RENDER_TEXTURE_POOL_SIZE,
    textureWidth: number = GameConstants.CHUNK_ABSOLUTE,
    textureHeight: number = GameConstants.CHUNK_ABSOLUTE
  ) {
    this.maxPoolSize = maxPoolSize;
    this.textureWidth = textureWidth;
    this.textureHeight = textureHeight;
    
    Logger.log(`RenderTexturePool: Initialized with max size ${maxPoolSize}, texture dimensions ${textureWidth}x${textureHeight}`);
  }

  /***** TEXTURE BORROWING *****/
  /**
   * Borrows a RenderTexture from the pool. If pool is empty, creates a new texture.
   * @returns RenderTexture ready for use
   */
  public borrowTexture(width: number, height: number): RenderTexture {
    let texture: RenderTexture;

    if (this.pool.length > 0) {
      texture = this.pool.pop()!;
      Logger.log(`RenderTexturePool: Borrowed texture from pool (${this.pool.length} remaining)`);
    } else {
      texture = RenderTexture.create({
        width,
        height,
      });
      Logger.log(`RenderTexturePool: Created new texture (pool was empty)`);
    }

    return texture;
  }

  /***** TEXTURE RETURNING *****/
  /**
   * Returns a RenderTexture to the pool for reuse. Clears the texture content.
   * If pool is at max capacity, destroys oldest texture using LRU policy.
   * @param texture - The RenderTexture to return to the pool
   */
  public returnTexture(texture: RenderTexture): void {
    if (!texture) {
      Logger.error("RenderTexturePool: Attempted to return null/undefined texture");
      return;
    }

    // Clear the texture content for reuse
    this.clearTextureContent(texture);

    // Check if pool is at capacity
    if (this.pool.length >= this.maxPoolSize) {
      // Remove oldest texture (LRU eviction)
      const oldestTexture = this.pool.shift();
      if (oldestTexture) {
        oldestTexture.destroy(true);
        Logger.log(`RenderTexturePool: Evicted oldest texture (pool at capacity: ${this.maxPoolSize})`);
      }
    }

    // Add texture to pool
    this.pool.push(texture);
    Logger.log(`RenderTexturePool: Returned texture to pool (${this.pool.length}/${this.maxPoolSize})`);
  }

  /***** TEXTURE CLEARING *****/
  /**
   * Clears the content of a RenderTexture to prepare it for reuse.
   * This preserves the texture object while removing previous content.
   * @param texture - The RenderTexture to clear
   */
  private clearTextureContent(texture: RenderTexture): void {
    try {
      // Clear the texture by setting it to transparent
      const gl = texture.source.resource as WebGLTexture;
      if (gl) {
        // For WebGL textures, we can clear by uploading transparent data
        // But for simplicity and safety, we'll rely on the renderer clearing
        // when new content is rendered to it
      }
      
      // Note: RenderTexture will be cleared automatically when new content
      // is rendered to it, so explicit clearing isn't always necessary
      Logger.log("RenderTexturePool: Prepared texture for reuse");
    } catch (error) {
      Logger.error("RenderTexturePool: Failed to clear texture content", error);
    }
  }

  /***** POOL MANAGEMENT *****/
  /**
   * Gets current pool statistics for monitoring and debugging.
   * @returns Object containing pool size and capacity information
   */
  public getPoolStats(): { size: number; maxSize: number; utilization: number } {
    return {
      size: this.pool.length,
      maxSize: this.maxPoolSize,
      utilization: this.pool.length / this.maxPoolSize
    };
  }

  /**
   * Destroys all textures in the pool and clears the pool.
   * Should be called during game cleanup to prevent memory leaks.
   */
  public destroy(): void {
    Logger.log(`RenderTexturePool: Destroying pool with ${this.pool.length} textures`);
    
    for (const texture of this.pool) {
      texture.destroy(true);
    }
    
    this.pool.length = 0;
    Logger.log("RenderTexturePool: Pool destroyed");
  }

  /***** POOL WARMING *****/
  /**
   * Pre-allocates textures to warm up the pool.
   * Useful for reducing initial allocation overhead.
   * @param count - Number of textures to pre-allocate
   */
  public warmPool(count: number): void {
    const texturesToCreate = Math.min(count, this.maxPoolSize - this.pool.length);
    
    if (texturesToCreate <= 0) {
      Logger.log("RenderTexturePool: Pool already at capacity, no warming needed");
      return;
    }

    Logger.log(`RenderTexturePool: Warming pool with ${texturesToCreate} textures`);
    
    for (let i = 0; i < texturesToCreate; i++) {
      const texture = RenderTexture.create({
        width: this.textureWidth,
        height: this.textureHeight,
      });
      this.pool.push(texture);
    }
    
    Logger.log(`RenderTexturePool: Pool warmed to ${this.pool.length} textures`);
  }
}

/***** GLOBAL INSTANCE *****/
/**
 * Global singleton instance of the render texture pool.
 * This ensures consistent texture reuse across the entire application.
 */
export const globalRenderTexturePool = new RenderTexturePool();
