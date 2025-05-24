import { noiseSeed, noise as perlinNoise } from "@chriscourses/perlin-noise";
import { Application, Container, Graphics, Sprite, type ContainerChild, type Texture } from "pixi.js";
import type { ChunkWorkerMessage, ChunkWorkerResponse } from "../../workers/chunkWorker";
import { WorkerPool } from "../../workers/workerPool";
import type { Game } from "../game/game";
import type { ChunkManagerMeta } from "./meta";
import { TileFactory } from "./tile";

/***** CHUNK GENERATOR *****/
export class ChunkGenerator {
  private tileFactory: TileFactory;
  private chunkTexture: Texture | null = null;
  private workerPool: WorkerPool;

  constructor(
    private app: Application,
    private chunkLoaderMeta: ChunkManagerMeta,
    private game?: Game // Optional for now to maintain compatibility
  ) {
    const tileSize = game?.consts.tileSize ?? 64;
    const chunkSize = game?.consts.chunkSize ?? 16;
    const size = chunkSize * tileSize;

    // Create tile factory (For background)
    this.tileFactory = new TileFactory(
      this.app.renderer.generateTexture(
        new Graphics()
          .rect(0, 0, size, size)
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

  private async initializeWorkerSeed(): Promise<void> {
    try {
      await this.workerPool.setSeed(this.chunkLoaderMeta.SEED);
      console.log(`Worker pool seeded with: ${this.chunkLoaderMeta.SEED}`);
    } catch (error) {
      console.error('Failed to seed worker pool:', error);
    }
  }

  public generateChunk = async (chunkX: number, chunkY: number): Promise<ContainerChild> => {    
    // Define the chunk container
    const chunk = new Container();

    // Predefine size properties
    const tileSize = this.game?.consts.tileSize ?? 64;
    const chunkSize = this.game?.consts.chunkSize ?? 16;
    const size = chunkSize * tileSize;
    
    chunk.x = chunkX * size;
    chunk.y = chunkY * size;
    chunk.width = size;
    chunk.height = size;
    chunk.zIndex = 0;
    chunk.sortableChildren = true;
    
    // Generate the background using web workers
    const background = await this.generateChunkBackgroundParallel(chunkX, chunkY);
    chunk.addChild(background);

    // Add debug border if enabled
    this.addDebugBorder(chunk);

    // Return the chunk for further processing
    return chunk;
  }

  private generateChunkBackgroundParallel = async (chunkX: number, chunkY: number): Promise<Container> => {
    // Define the background of the chunk
    const background = new Container()

    const tileSize = this.game?.consts.tileSize ?? 64;
    const chunkSize = this.game?.consts.chunkSize ?? 16;
    const size = chunkSize * tileSize;
    
    background.x = 0;
    background.y = 0;
    background.width = size;
    background.height = size;
    background.zIndex = -1;
    background.sortableChildren = true;

    // Use web worker to generate tile data
    const noiseDivisor = 500;
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

  private generateChunkBackgroundSync = (chunkX: number, chunkY: number): Container => {
    // Fallback synchronous generation (original method with actual perlin noise)
    const background = new Container()

    const tileSize = this.game?.consts.tileSize ?? 64;
    const chunkSize = this.game?.consts.chunkSize ?? 16;
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
    const noiseDivisor = 500;

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

  // Helper method to convert string to number for seeding (same as in worker)
  private stringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private addDebugBorder = (container: Container) => {
    const tileSize = this.game?.consts.tileSize ?? 64;
    const chunkSize = this.game?.consts.chunkSize ?? 16;
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

      container.addChild(rectangle);
    }
  }

  // Clean up worker pool when generator is destroyed
  public destroy(): void {
    this.workerPool.terminate();
  }

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