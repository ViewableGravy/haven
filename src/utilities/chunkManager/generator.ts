import { noise as perlinNoise } from "@chriscourses/perlin-noise";
import { Application, Container, Graphics, Sprite, type ContainerChild, type Texture } from "pixi.js";
import type { ChunkManagerMeta } from "./meta";
import { TileFactory } from "./tile";

/***** CHUNK GENERATOR *****/
export class ChunkGenerator {
  private chunkTexture: Texture | null = null;

  constructor(
    private app: Application,
    private chunkLoaderMeta: ChunkManagerMeta,
  ) { }

  public generateChunk = async (chunkX: number, chunkY: number): Promise<ContainerChild> => {
    const chunk = new Container();

    chunk.x = chunkX * this.chunkLoaderMeta.CHUNK_SIZE;
    chunk.y = chunkY * this.chunkLoaderMeta.CHUNK_SIZE;
    chunk.width = this.chunkLoaderMeta.CHUNK_SIZE;
    chunk.height = this.chunkLoaderMeta.CHUNK_SIZE;

    // Create tile factory
    const tileFactory = new TileFactory(
      this.app.renderer.generateTexture(
        new Graphics()
          .rect(0, 0, this.chunkLoaderMeta.CHUNK_SIZE, this.chunkLoaderMeta.CHUNK_SIZE)
          .fill(0xFFFFFF)
      )
    );

    // Create inidividual sprites
    const divisor = 16;
    for (let i = 0; i < divisor; i++) {
      for (let j = 0; j < divisor; j++) {
        const size = this.chunkLoaderMeta.CHUNK_SIZE;
        const x = (size / divisor) * i;
        const y = (size / divisor) * j;

        const tile = tileFactory.createPrimitive({
          width: size / divisor,
          height: size / divisor,
          tint: Number(ChunkGenerator.seedShade((chunk.x + x) / 500, (chunk.y + y) / 500)),
          x,
          y,
        });

        chunk.addChild(tile);
      }
    }

    this.addDebugBorder(chunk);

    chunk.cacheAsTexture(true);
    chunk.interactive = false;

    return chunk;
  }

  private addDebugBorder = (container: Container) => {
    // Create the texture once if it doesn't already exist
    if (!this.chunkTexture) {
      const borderGraphic = new Graphics()
        .rect(0, 0, this.chunkLoaderMeta.CHUNK_SIZE, this.chunkLoaderMeta.CHUNK_SIZE)
        .stroke({ width: 1, color: 0xFF0000, alpha: 0.2 })

      // Use app.renderer to generate the texture
      this.chunkTexture = this.app.renderer.generateTexture(borderGraphic);
    }

    // Add a debug outline to the chunk and add it to the container
    if (this.chunkLoaderMeta.DEBUG) {
      const rectangle = Sprite.from(this.chunkTexture);

      rectangle.width = this.chunkLoaderMeta.CHUNK_SIZE;
      rectangle.height = this.chunkLoaderMeta.CHUNK_SIZE;

      container.addChild(rectangle);
    }
  }

  private static seedShade = (x: number, y: number) => {
    // 0-1
    const _x: number = perlinNoise(x, y);
    // convert to 0-255
    const color: number = Math.floor((_x) * 224);
    // convert to hex
    const hex: string = color.toString(16).padStart(2, '0').toUpperCase();

    return `0x${hex}${hex}${hex}`;
  }
}