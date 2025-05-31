/***** TYPE DEFINITIONS *****/
import invariant from "tiny-invariant";
import { SpriteAtlas } from '../sprites/SpriteAtlas';
import type { SpriteAtlasData } from '../sprites/SpriteAtlas';
import { SceneNode } from '../sprites/SceneGraph';
import CharacterSheet from '../assets/level1_idle.png';

export type MovementDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'idle';

export interface AnimationFrames {
  idle: Array<string>; north: Array<string>; northeast: Array<string>; east: Array<string>; southeast: Array<string>; south: Array<string>; southwest: Array<string>; west: Array<string>; northwest: Array<string>;
}

/***** CHARACTER SPRITE CLASS *****/
export class CharacterSprite {
  private static __spriteAtlas: SpriteAtlas | null = null;
  public static animations: AnimationFrames = {
    north: [],
    northeast: [],
    east: [],
    southeast: [],
    south: [],
    southwest: [],
    west: [],
    northwest: [],
    idle: []
  };

  /**
   * Load the character sprite atlas
   */
  public static load = async (): Promise<void> => {
    throw new Error("Use loadWithGL method for WebGL rendering");
  };

  /**
   * Load the character sprite atlas with WebGL context
   */
  public static loadWithGL = async (gl: WebGLRenderingContext): Promise<void> => {
    // Create sprite atlas with WebGL context
    const characterSpriteAtlas = new SpriteAtlas(gl);

    // Load using our atlas data
    await characterSpriteAtlas.loadFromData(CharacterSprite.atlas);

    // Set the sprite atlas
    CharacterSprite.__spriteAtlas = characterSpriteAtlas;
  };

  /**
   * Get the loaded sprite atlas
   */
  public static getAtlas = (): SpriteAtlas => {
    invariant(CharacterSprite.__spriteAtlas, "Character sprite atlas not loaded");
    return CharacterSprite.__spriteAtlas;
  };

  /**
   * Create a sprite node from a specific frame
   */
  public static createSprite = (name: keyof typeof CharacterSprite.atlas['frames']): SceneNode => {
    invariant(CharacterSprite.__spriteAtlas, "Character sprite atlas not loaded");
    
    // Create scene node for WebGL rendering
    const node = new SceneNode();
    
    // Set texture and size
    node.setTexture(CharacterSprite.__spriteAtlas, name, 92, 116);

    return node;
  };

  /**
   * Atlas configuration for the character sprite sheet
   * 5th row (index 4) and 11th column (index 10)
   * Sheet: 2024x928 pixels, 8 rows x 22 columns
   * Tile size: ~92x116 pixels (2024/22 = 92, 928/8 = 116)
   */
  public static atlas: SpriteAtlasData = {
    frames: {
      "character-idle": {
        frame: { x: 920, y: 464, width: 92, height: 116 }, // 11th column (10 * 92), 5th row (4 * 116)
        sourceSize: { w: 92, h: 116 },
        spriteSourceSize: { x: 0, y: 0, width: 92, height: 116 },
      }
    },
    meta: {
      image: CharacterSheet,
      size: { w: 2024, h: 928 },
      scale: 1
    }
  };

  /**
   * Get animation frame arrays
   */
  public static getAnimations = () => {
    return CharacterSprite.animations;
  };

  // PIXI.js compatibility method for existing code
  public static getSpriteSheet = () => {
    return {
      animations: CharacterSprite.animations
    };
  };
}