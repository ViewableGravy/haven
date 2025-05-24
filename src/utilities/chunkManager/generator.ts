import { noise as perlinNoise } from "@chriscourses/perlin-noise";
import { Application, Container, Graphics, Sprite, type ContainerChild, type Texture } from "pixi.js";
import type { Game } from "../game/game";
import type { ChunkManagerMeta } from "./meta";
import { TileFactory } from "./tile";

/***** CHUNK GENERATOR *****/
export class ChunkGenerator {
  private tileFactory: TileFactory;
  private chunkTexture: Texture | null = null;

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
    
    // Generate the background
    const background = this.generateChunkBackground(chunkX, chunkY);
    chunk.addChild(background);

    // Add debug border if enabled
    this.addDebugBorder(chunk);

    // Return the chunk for further processing
    return chunk;
  }

  private generateChunkBackground = (chunkX: number, chunkY: number): Container => {
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

    
    // Create individual sprites, and add them to the background
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