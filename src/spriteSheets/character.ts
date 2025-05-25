import { Assets, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import CharacterSheet from '../assets/level1_idle.png';

/***** TYPE DEFINITIONS *****/

/***** CHARACTER SPRITE CLASS *****/
export class CharacterSprite {
  private static __spriteSheet: Spritesheet | null = null;

  /**
   * Load the character sprite sheet assets
   */
  public static load = async () => {
    // Load the asset sheet
    await Assets.load(CharacterSprite.atlas.meta.image);

    // Create a spritesheet
    const characterSpriteSheet = new Spritesheet(
      Texture.from(CharacterSprite.atlas.meta.image),
      CharacterSprite.atlas
    );

    // Parse the spritesheet
    await characterSpriteSheet.parse();

    // Set the sprite sheet
    CharacterSprite.__spriteSheet = characterSpriteSheet;
  }

  /**
   * Get the loaded sprite sheet
   */
  public static getSpriteSheet = () => {
    invariant(CharacterSprite.__spriteSheet, "Character sprite sheet not loaded");
    return CharacterSprite.__spriteSheet;
  }

  /**
   * Create a sprite from the character sheet
   */
  public static createSprite = (name: keyof typeof CharacterSprite.atlas['frames']) => {
    invariant(CharacterSprite.__spriteSheet, "Character sprite sheet not loaded");
    return new Sprite(
      CharacterSprite.__spriteSheet.textures[name]
    );
  }

  /**
   * Atlas configuration for the character sprite sheet
   * 5th row (index 4) and 11th column (index 10)
   * Sheet: 2024x928 pixels, 8 rows x 22 columns
   * Tile size: ~92x116 pixels (2024/22 = 92, 928/8 = 116)
   */
  public static atlas = {
    frames: {
      "character-idle": {
        frame: { x: 920, y: 464, w: 92, h: 116 }, // 11th column (10 * 92), 5th row (4 * 116)
        sourceSize: { w: 92, h: 116 },
        spriteSourceSize: { x: 0, y: 0, w: 92, h: 116 },
      }
    },
    meta: {
      image: CharacterSheet,
      size: { w: 2024, h: 928 },
      scale: 1
    },
    animations: {
      idle: ["character-idle"]
    }
  }
}