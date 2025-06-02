import { Assets, Sprite, Spritesheet, Texture } from '@pixi/node';
import path from 'path';
import invariant from "tiny-invariant";
import { fileURLToPath } from 'url';

/***** TYPE DEFINITIONS *****/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/***** SPRUCE TREE SPRITE CLASS *****/
export class ServerSpruceTreeSprite {
  private static __spriteSheet: Spritesheet | null = null;

  /**
   * Load the spruce tree sprite sheet assets
   */
  public static load = async (): Promise<void> => {
    // Load the asset sheet using file path (navigate up to project root)
    const assetPath = path.resolve(__dirname, '../../../assets/spruce-tree.png');
    await Assets.load(assetPath);

    // Create a spritesheet
    const spruceTreeSpriteSheet = new Spritesheet(
      Texture.from(assetPath),
      ServerSpruceTreeSprite.atlas
    );

    // Parse the spritesheet
    await spruceTreeSpriteSheet.parse();

    // Set the sprite sheet
    ServerSpruceTreeSprite.__spriteSheet = spruceTreeSpriteSheet;
  };

  /**
   * Get the loaded sprite sheet
   */
  public static getSpriteSheet = (): Spritesheet => {
    invariant(ServerSpruceTreeSprite.__spriteSheet, "Spruce tree sprite sheet not loaded");
    return ServerSpruceTreeSprite.__spriteSheet;
  };

  /**
   * Create a sprite from the spruce tree sheet
   */
  public static createSprite = (name: keyof typeof ServerSpruceTreeSprite.atlas['frames']): Sprite => {
    invariant(ServerSpruceTreeSprite.__spriteSheet, "Spruce tree sprite sheet not loaded");
    return new Sprite(
      ServerSpruceTreeSprite.__spriteSheet.textures[name]
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
      image: path.resolve(__dirname, '../../../assets/spruce-tree.png'),
      size: { w: 1024, h: 1024 },
      scale: 1
    },
    animations: {}
  };
}
