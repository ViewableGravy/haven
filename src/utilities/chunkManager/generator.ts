/***** TYPE DEFINITIONS *****/
import { noiseSeed, noise as perlinNoise } from "@chriscourses/perlin-noise";
import { Application, Container, Graphics, Sprite, type Texture } from "pixi.js";
import { GameConstants } from "../../shared/constants";
import type { ChunkWorkerMessage, ChunkWorkerResponse } from "../../workers/chunkWorker";
import { WorkerPool } from "../../workers/workerPool";
import type { Game } from "../game/game";
import { Chunk } from "./chunk";
import type { ChunkManagerMeta } from "./meta";
import { TileFactory } from "./tile";

/***** CHUNK GENERATOR *****/
/**
 * Generates chunk content including background tiles using parallel processing with web workers
 */
export class ChunkGenerator {
  private tileFactory: TileFactory;
  private chunkTexture: Texture | null = null;
  private workerPool: WorkerPool;

  constructor(
    private app: Application,
    private chunkLoaderMeta: ChunkManagerMeta,
    private game: Game
  ) {
    const tileSize = GameConstants.TILE_SIZE;
    const chunkSize = GameConstants.CHUNK_SIZE;
    const size = chunkSize * tileSize;

    // Create tile factory (For background)
    this.tileFactory = new TileFactory(
      this.app.renderer.generateTexture(
        new Graphics()
          .rect(0, 0, tileSize, tileSize)
          .fill(0xFFFFFF)
      ),
      game
    );

    // Use app.renderer to generate the texture
    this.chunkTexture = this.app.renderer.generateTexture(
      new Graphics()
        .rect(0, 0, size, size)
        .stroke({ width: 1, color: 0xFF0000, alpha: 0.2 })
    );

    // Initialize worker pool for parallel processing
    this.workerPool = new WorkerPool();
    
    // Set the seed for all workers to ensure consistent noise generation
    this.initializeWorkerSeed();
  }

  /**
   * Initializes all workers in the pool with the same noise seed for consistent generation
   * @private
   * @returns Promise that resolves when all workers are seeded
   */
  private async initializeWorkerSeed(): Promise<void> {
    try {
      await this.workerPool.setSeed(this.chunkLoaderMeta.SEED);
    } catch (error) {
      console.error('Failed to seed worker pool:', error);
    }
  }

  /**
   * Generates a complete chunk at the specified coordinates
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Promise resolving to a Chunk instance
   */
  public generateChunk = async (chunkX: number, chunkY: number): Promise<Chunk> => {    
    // Create the new Chunk instance
    const chunk = new Chunk(this.game, chunkX, chunkY);
    
    // Generate the background using web workers
    const background = await this.generateChunkBackgroundParallel(chunkX, chunkY);
    chunk.addChild(background);

    // Add debug border if enabled
    this.addDebugBorder(chunk);

    // Return the chunk for further processing
    return chunk;
  }

  /**
   * Generates chunk background using web workers for parallel processing
   * Falls back to synchronous generation if workers fail
   * @private
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Promise resolving to a container with the background tiles
   */
  private generateChunkBackgroundParallel = async (chunkX: number, chunkY: number): Promise<Container> => {
    // Define the background of the chunk
    const background = new Container()

    const tileSize = GameConstants.TILE_SIZE;
    const chunkSize = GameConstants.CHUNK_SIZE;
    const size = chunkSize * tileSize;
    
    background.x = 0;
    background.y = 0;
    background.width = size;
    background.height = size;
    background.zIndex = -1;
    background.sortableChildren = true;

    // Use web worker to generate tile data
    const noiseDivisor = GameConstants.NOISE_DIVISOR;
    const workerMessage: ChunkWorkerMessage = {
      type: 'generateBackground',
      data: {
        chunkX,
        chunkY,
        tileSize,
        chunkSize,
        noiseDivisor,
        seed: this.chunkLoaderMeta.SEED
      }
    };

    try {
      const workerResponse: ChunkWorkerResponse = await this.workerPool.execute(workerMessage);
      
      // Create sprites from worker-generated tile data
      if (workerResponse.data.tiles) {
        for (const tileData of workerResponse.data.tiles) {
          const tile = this.tileFactory.createPrimitive({
            tint: tileData.tint,
            x: tileData.x,
            y: tileData.y,
          });

          background.addChild(tile);
        }
      } else {
        throw new Error('Worker response missing tile data');
      }
    } catch (error) {
      console.error('Worker failed, falling back to synchronous generation:', error);
      // Fallback to synchronous generation if worker fails
      return this.generateChunkBackgroundSync(chunkX, chunkY);
    }

    // Disable interaction for the background for better performance
    background.interactive = false;
    background.interactiveChildren = false;

    // Cache the background as a texture (and render this instead of the individual items)
    background.cacheAsTexture(true);

    return background;
  }

  /**
   * Fallback synchronous background generation using perlin noise
   * Used when web workers are unavailable or fail
   * @private
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Container with synchronously generated background tiles
   */
  private generateChunkBackgroundSync = (chunkX: number, chunkY: number): Container => {
    // Fallback synchronous generation (original method with actual perlin noise)
    const background = new Container()

    const tileSize = GameConstants.TILE_SIZE;
    const chunkSize = GameConstants.CHUNK_SIZE;
    const size = chunkSize * tileSize;
    
    background.x = 0;
    background.y = 0;
    background.width = size;
    background.height = size;
    background.zIndex = -1;
    background.sortableChildren = true;

    // Ensure consistent seeding for the synchronous fallback
    const seedValue = typeof this.chunkLoaderMeta.SEED === 'string' 
      ? this.stringToNumber(this.chunkLoaderMeta.SEED) 
      : this.chunkLoaderMeta.SEED;
    noiseSeed(seedValue);

    // Create individual sprites synchronously using perlin noise
    const noiseDivisor = GameConstants.NOISE_DIVISOR;

    for (let i = 0; i < chunkSize; i++) {
      for (let j = 0; j < chunkSize; j++) {
        const x = tileSize * i;
        const y = tileSize * j;

        const xOffset = (chunkX * size) + x;
        const yOffset = (chunkY * size) + y;
        const tint = Number(ChunkGenerator.seedShade(xOffset / noiseDivisor, yOffset / noiseDivisor));

        const tile = this.tileFactory.createPrimitive({
          tint,
          x,
          y,
        });

        background.addChild(tile);
      }
    }

    // Disable interaction for the background for better performance
    background.interactive = false;
    background.interactiveChildren = false;

    // Cache the background as a texture (and render this instead of the individual items)
    background.cacheAsTexture(true);

    return background;
  }

  /**
   * Converts a string to a numeric hash for seeding purposes
   * @private
   * @param str - The string to convert to a number
   * @returns A numeric hash of the input string
   */
  private stringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Adds a debug border around the chunk for visual debugging
   * Only adds border if DEBUG flag is enabled in metadata
   * @private
   * @param chunk - The chunk to add the border to
   */
  private addDebugBorder = (chunk: Chunk) => {
    const tileSize = GameConstants.TILE_SIZE;
    const chunkSize = GameConstants.CHUNK_SIZE;
    const size = chunkSize * tileSize;

    // Create the texture once if it doesn't already exist
    if (!this.chunkTexture) {
      const borderGraphic = new Graphics()
        .rect(0, 0, size, size)
        .stroke({ width: 1, color: 0xFF0000, alpha: 0.2 })

      // Use app.renderer to generate the texture
      this.chunkTexture = this.app.renderer.generateTexture(borderGraphic);
    }

    // Add a debug outline to the chunk and add it to the container
    if (this.chunkLoaderMeta.DEBUG) {
      const rectangle = Sprite.from(this.chunkTexture);

      rectangle.width = size;
      rectangle.height = size;

      chunk.addChild(rectangle);
    }
  }

  /**
   * Cleans up resources and terminates all worker threads
   */
  public destroy(): void {
    this.workerPool.terminate();
  }

  /**
   * Generates a shade value based on perlin noise at the given coordinates
   * @private
   * @static
   * @param x - The x coordinate for noise generation
   * @param y - The y coordinate for noise generation
   * @returns Hex color string representing the shade
   */
  private static seedShade = (x: number, y: number) => {
    // 0-1
    const _x: number = perlinNoise(x, y);
    // convert to 0-255
    const color: number = Math.floor(_x * 224);
    // convert to hex
    const hex: string = color.toString(16).padStart(2, '0').toUpperCase();

    return `0x${hex}${hex}${hex}`;
  }
}