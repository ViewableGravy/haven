import { Assets, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import SpruceTreeAsset from '../assets/spruce-tree.png';

/***** TYPE DEFINITIONS *****/

/***** SPRUCE TREE SPRITE CLASS *****/
export class SpruceTreeSprite {
  private static __spriteSheet: Spritesheet | null = null;

  /**
   * Load the spruce tree sprite sheet assets
   */
  public static load = async (): Promise<void> => {
    // Load the asset sheet
    await Assets.load(SpruceTreeSprite.atlas.meta.image);

    // Create a spritesheet
    const spruceTreeSpriteSheet = new Spritesheet(
      Texture.from(SpruceTreeSprite.atlas.meta.image),
      SpruceTreeSprite.atlas
    );

    // Parse the spritesheet
    await spruceTreeSpriteSheet.parse();

    // Set the sprite sheet
    SpruceTreeSprite.__spriteSheet = spruceTreeSpriteSheet;
  };

  /**
   * Get the loaded sprite sheet
   */
  public static getSpriteSheet = (): Spritesheet => {
    invariant(SpruceTreeSprite.__spriteSheet, "Spruce tree sprite sheet not loaded");
    return SpruceTreeSprite.__spriteSheet;
  };

  /**
   * Create a sprite from the spruce tree sheet
   */
  public static createSprite = (name: keyof typeof SpruceTreeSprite.atlas['frames']): Sprite => {
    invariant(SpruceTreeSprite.__spriteSheet, "Spruce tree sprite sheet not loaded");
    return new Sprite(
      SpruceTreeSprite.__spriteSheet.textures[name]
    );
  };

  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the spruce tree sprite sheet
   * Single sprite asset for the spruce tree
   */
  public static atlas = {
    frames: {
      "spruce-tree": {
        frame: { x: 222, y: 0, w: 600, h: 1024 }, // Estimated size: 2x3 tiles (128x192)
        sourceSize: { w: 600, h: 1024 },
        spriteSourceSize: { x: 0, y: 0, w: 600, h: 1024 },
      }
    },
    meta: {
      image: SpruceTreeAsset,
      size: { w: 1024, h: 1024 },
      scale: 1
    },
    animations: {}
  };
}
