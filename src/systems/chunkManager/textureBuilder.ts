import { Container, Sprite, type Renderer, type RenderTexture } from "pixi.js";
import type { LoadChunkEvent } from "../../server/types/events/load_chunk";
import { GameConstants } from "../../shared/constants";
import { MeadowSprite, type MeadowSpriteName } from "../../spriteSheets/meadow/meadow";
import { SpritePool } from "../../spriteSheets/meadow/pool";
import { logger } from "../../utilities/logger";
import { globalRenderTexturePool, type RenderTexturePool } from "./renderTexturePool";

type SpriteNames = MeadowSpriteName;

export interface SpriteSheet {
  normalizedSpriteNames: Record<string, true>;
  createSprite(name: SpriteNames): Sprite;
}

/**
 * ChunkTextureBuilder manages the creation of the chunk background texture. This handles the 
 * necessary connections between different spritesheets and building the actual structure 
 * based on the requested chunk data. Supported sprites include:
 * 
 * - MeadowSprites
 */
export class ChunkTextureBuilder extends SpritePool<SpriteNames> {
// variables::
  private container: Container;
  private renderTexturePool: RenderTexturePool;

  private meadowSprite: MeadowSprite = new MeadowSprite();

// constrctor:
  constructor(
    private renderer: Renderer
  ) {
    super();
    this.container = new Container();
    this.renderTexturePool = globalRenderTexturePool;
  }

// public:
  public createSprite = (name: SpriteNames): Sprite => {
    switch (true) {
      case this.meadowSprite.normalizedSpriteNames[name]:
        return this.meadowSprite.createSprite(name);
      default:
        throw new Error(`Unknown sprite name: ${name}`);
    }
  };

  public createChunkBackgroundTexture = (tiles: Array<LoadChunkEvent.Tile>): RenderTexture => {
    const { TILE_SIZE, CHUNK_ABSOLUTE } = GameConstants;
    
    // Borrow a render texture from the pool
    const renderTexture = this.renderTexturePool.borrowTexture(CHUNK_ABSOLUTE, CHUNK_ABSOLUTE);

    const borrowedSprites: Array<() => void> = [];

    // Add all sprites to the temporary container
    for (const tile of tiles) {
      const name = this.mapTileToName(tile);
      const [sprite, release] = this.borrowSprite(name);

      // set the release function to be called later on cleanup
      borrowedSprites.push(release);
      
      // TODO: Make sure all sprites are 64x64 pixels, to avoid runtime calculations
      // Scale sprite from 270x270 to tile MeadowSprite.size (64x64)
      const scale = TILE_SIZE / MeadowSprite.size;
      sprite.scale.set(scale);
      
      // Position sprite
      sprite.x = tile.x;
      sprite.y = tile.y;
      
      // add the sprite to the container for rendering
      this.container.addChild(sprite);
    }

    // Render all sprites to the render texture
    this.renderer.render(this.container, { renderTexture });

    // Clean up: remove all sprites from the container (this automatically removes it as a parent)
    this.container.removeChildren();

    // Clean up: Release borrowed sprites back to the pool
    for (const release of borrowedSprites) {
      release();
    }
    
    logger.log(`ChunkManager: Created sprite-based background texture using pooled RenderTexture`);
    return renderTexture;
  }

// private:
  private mapTileToName = (tile: LoadChunkEvent.Tile): SpriteNames => {
    const { biome, index } = tile;

    switch (biome) {
      case "meadow":
        return MeadowSprite.castIndexToName(index);
      default:
        throw new Error(`Unknown biome: ${biome}`);
    }
  }
}