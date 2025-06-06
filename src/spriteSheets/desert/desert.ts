/***** TYPE DEFINITIONS *****/
import { Assets, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import DesertSpritesAsset from '../../assets/desert-sprites.png';

export type DesertSpriteName = "desert-0" | "desert-1" | "desert-2" | "desert-3" | "desert-4" | "desert-5" | "desert-6" | "desert-7" | "desert-8";
export type Atlas<TFrames extends string> = {
  frames: Record<TFrames, {
    frame: { x: number, y: number, w: number, h: number },
    sourceSize: { w: number, h: number },
    spriteSourceSize: { x: number, y: number, w: number, h: number }
  }>,
  meta: {
    image: string,
    DesertSpriteSize: { w: number, h: number },
    scale: number
  },
  animations?: Record<string, Array<DesertSpriteName>>
};

/***** DESERT SPRITE CLASS *****/
export class DesertSprite {
  private static __spriteSheet: Spritesheet | null = null;

// public static:
  public static createSprite = (name: DesertSpriteName): Sprite => {
    invariant(DesertSprite.__spriteSheet, "Desert sprite sheet not loaded");
    return new Sprite(
      DesertSprite.__spriteSheet.textures[name]
    );
  };

  public static normalizedSpriteNames: Record<DesertSpriteName, true> = {
    "desert-0": true,
    "desert-1": true,
    "desert-2": true,
    "desert-3": true,
    "desert-4": true,
    "desert-5": true,
    "desert-6": true,
    "desert-7": true,
    "desert-8": true
  };
  
  public static size = 290; 
  public static load = async (): Promise<void> => {
    // Load the asset sheet
    await Assets.load(DesertSprite.atlas.meta.image);

    // Create a spritesheet
    const desertSpriteSheet = new Spritesheet(
      Texture.from(DesertSprite.atlas.meta.image),
      DesertSprite.atlas
    );

    // Parse the spritesheet
    await desertSpriteSheet.parse();

    // Set the sprite sheet
    DesertSprite.__spriteSheet = desertSpriteSheet;
  };

  /**
   * Convert a numeric index (0-8) to a DesertSprite name
   */
  public static castIndexToName = (index: number): DesertSpriteName => {
    switch (index) {
      case 0: return `desert-0`;
      case 1: return `desert-1`;
      case 2: return `desert-2`;
      case 3: return `desert-3`;
      case 4: return `desert-4`;
      case 5: return `desert-5`;
      case 6: return `desert-6`;
      case 7: return `desert-7`;
      case 8: return `desert-8`;
      default:
        throw new Error(`Invalid sprite index: ${index}. Must be 0-8.`);
    }
  };

  public static getSpriteSheet = (): Spritesheet => {
    invariant(DesertSprite.__spriteSheet, "Desert sprite sheet not loaded");
    return DesertSprite.__spriteSheet;
  };

  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the desert sprite sheet
   * Sheet: 9 sprites arranged in 3 rows x 3 columns
   * Sprite size: 300x300 pixels each, starting at (20, 20)
   */
  public static atlas: Atlas<DesertSpriteName> = {
    frames: {
      "desert-0": {
        frame: { x: 20, y: 25, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-1": {
        frame: { x: 355, y: 25, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-2": {
        frame: { x: 695, y: 25, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-3": {
        frame: { x: 20, y: 345, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-4": {
        frame: { x: 355, y: 345, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-5": {
        frame: { x: 695, y: 345, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-6": {
        frame: { x: 20, y: 670, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-7": {
        frame: { x: 355, y: 670, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      },
      "desert-8": {
        frame: { x: 695, y: 670, w: DesertSprite.size, h: DesertSprite.size },
        sourceSize: { w: DesertSprite.size, h: DesertSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: DesertSprite.size, h: DesertSprite.size },
      }
    },
    meta: {
      image: DesertSpritesAsset,
      DesertSpriteSize: { w: 920, h: 920 },
      scale: 1
    },
    animations: {}
  };
}
