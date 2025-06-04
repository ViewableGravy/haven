/***** TYPE DEFINITIONS *****/
import { Assets, Container, RenderTexture, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import MeadowSpritesAsset from '../../assets/meadow-sprites.png';
import { SpritePool } from "./pool";

type MeadowSpriteName = "meadow-0" | "meadow-1" | "meadow-2" | "meadow-3" | "meadow-4" | "meadow-5";
type Atlas<TFrames extends string> = {
  frames: Record<TFrames, {
    frame: { x: number, y: number, w: number, h: number },
    sourceSize: { w: number, h: number },
    spriteSourceSize: { x: number, y: number, w: number, h: number }
  }>,
  meta: {
    image: string,
    MeadowSpriteSize: { w: number, h: number },
    scale: number
  },
  animations?: Record<string, Array<MeadowSpriteName>>
};

/***** MEADOW SPRITE CLASS *****/
export class MeadowSprite extends SpritePool<MeadowSpriteName> {
// private:
  container: Container;

// constructor:
  constructor() {
    super();
    this.container = new Container();
  }

// public:
  public createSprite = (name: MeadowSpriteName): Sprite => {
    invariant(MeadowSprite.__spriteSheet, "Meadow sprite sheet not loaded");
    return new Sprite(
      MeadowSprite.__spriteSheet.textures[name]
    );
  };

  /**
   * Create an optimized chunk background texture from sprite indices
   * @param spriteData - Array of sprite data with positions and indices
   * @param renderer - PIXI renderer for texture generation
   * @param chunkSize - Size of the chunk in pixels (typically 1024)
   * @param tileSize - Size of each tile in pixels (typically 64)
   * @returns Rendered texture containing all sprites
   */
  public createChunkTexture = (
    spriteData: Array<{ x: number, y: number, spriteIndex: number }>,
    renderer: any,
    chunkSize: number,
    tileSize: number
  ): RenderTexture => {
    // Create render texture for the chunk
    const renderTexture = RenderTexture.create({
      width: chunkSize,
      height: chunkSize,
    });

    const borrowedSprites: Array<() => void> = [];
    
    // Add all sprites to the temporary container
    for (const data of spriteData) {
      const name = MeadowSprite.castIndexToName(data.spriteIndex);
      const [sprite, release] = this.borrowSprite(name);

      borrowedSprites.push(release);
      
      // Scale sprite from 270x270 to tile MeadowSprite.size (64x64)
      const scale = tileSize / MeadowSprite.size;
      sprite.scale.set(scale);
      
      // Position sprite
      sprite.x = data.x;
      sprite.y = data.y;
      
      this.container.addChild(sprite);
    }

    // Render all sprites to the render texture
    renderer.render(this.container, { renderTexture });

    // Clean up: remove all sprites from the container (this automatically removes it as a parent)
    this.container.removeChildren();

    // Clean up: Release borrowed sprites back to the pool
    for (const release of borrowedSprites) {
      release();
    }

    return renderTexture;
  };

// private static declarations::
  private static __spriteSheet: Spritesheet | null = null;
  private static size = 250; 

// private static:
  /**
   * Convert a numeric index (0-5) to a MeadowSprite name
   */
  private static castIndexToName = (index: number): MeadowSpriteName => {
    switch (index) {
      case 0: return `meadow-0`;
      case 1: return `meadow-1`;
      case 2: return `meadow-2`;
      case 3: return `meadow-3`;
      case 4: return `meadow-4`;
      case 5: return `meadow-5`;
      default:
        throw new Error(`Invalid sprite index: ${index}. Must be 0-5.`);
    }
  };

// public static:
  public static load = async (): Promise<void> => {
    // Load the asset sheet
    await Assets.load(MeadowSprite.atlas.meta.image);

    // Create a spritesheet
    const meadowSpriteSheet = new Spritesheet(
      Texture.from(MeadowSprite.atlas.meta.image),
      MeadowSprite.atlas
    );

    // Parse the spritesheet
    await meadowSpriteSheet.parse();

    // Set the sprite sheet
    MeadowSprite.__spriteSheet = meadowSpriteSheet;
  };

  public static getSpriteSheet = (): Spritesheet => {
    invariant(MeadowSprite.__spriteSheet, "Meadow sprite sheet not loaded");
    return MeadowSprite.__spriteSheet;
  };

  // Size of each sprite in the atlas
  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the meadow sprite sheet
   * Sheet: 1024x1024 pixels, 6 sprites arranged in 2 rows x 3 columns
   * Sprite MeadowSprite.size: 270x270 pixels each
   */
  public static atlas: Atlas<MeadowSpriteName> = {
    frames: {
      "meadow-0": {
        frame: { x: 64, y: 116, w: MeadowSprite.size, h: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: MeadowSprite.size, h: MeadowSprite.size },
      },
      "meadow-1": {
        frame: { x: 384, y: 116, w: MeadowSprite.size, h: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: MeadowSprite.size, h: MeadowSprite.size },
      },
      "meadow-2": {
        frame: { x: 688, y: 116, w: MeadowSprite.size, h: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: MeadowSprite.size, h: MeadowSprite.size },
      },
      "meadow-3": {
        frame: { x: 64, y: 422, w: MeadowSprite.size, h: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: MeadowSprite.size, h: MeadowSprite.size },
      },
      "meadow-4": {
        frame: { x: 384, y: 422, w: MeadowSprite.size, h: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: MeadowSprite.size, h: MeadowSprite.size },
      },
      "meadow-5": {
        frame: { x: 688, y: 422, w: MeadowSprite.size, h: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: MeadowSprite.size, h: MeadowSprite.size },
      }
    },
    meta: {
      image: MeadowSpritesAsset,
      MeadowSpriteSize: { w: 1024, h: 1024 },
      scale: 1
    },
    animations: {}
  };
}
