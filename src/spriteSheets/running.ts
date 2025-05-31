/***** TYPE DEFINITIONS *****/
import invariant from "tiny-invariant";
import { SpriteAtlas } from '../sprites/SpriteAtlas';
import type { SpriteAtlasData } from '../sprites/SpriteAtlas';
import { SceneNode } from '../sprites/SceneGraph';
import RunningSheet from '../assets/level1_running.png';

type RunningDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';

/***** RUNNING SPRITE CLASS *****/
export class RunningSprite {
  private static __spriteAtlas: SpriteAtlas | null = null;

  /**
   * Load the running sprite atlas
   */
  public static load = async (): Promise<void> => {
    throw new Error("Use loadWithGL method for WebGL rendering");
  };

  /**
   * Load the running sprite atlas with WebGL context
   */
  public static loadWithGL = async (gl: WebGLRenderingContext): Promise<void> => {
    // Create sprite atlas with WebGL context
    const runningSpriteAtlas = new SpriteAtlas(gl);

    // Load using our atlas data
    await runningSpriteAtlas.loadFromData(RunningSprite.atlas);

    // Set the sprite atlas
    RunningSprite.__spriteAtlas = runningSpriteAtlas;
  };

  /**
   * Get the loaded sprite atlas
   */
  public static getAtlas = (): SpriteAtlas => {
    invariant(RunningSprite.__spriteAtlas, "Running sprite atlas not loaded");
    return RunningSprite.__spriteAtlas;
  };

  /**
   * Create a sprite node from a specific frame
   */
  public static createSprite = (name: keyof typeof RunningSprite.atlas['frames']): SceneNode => {
    invariant(RunningSprite.__spriteAtlas, "Running sprite atlas not loaded");
    
    // Create scene node for WebGL rendering
    const node = new SceneNode();
    
    // Set texture and size
    node.setTexture(RunningSprite.__spriteAtlas, name, 88, 132);

    return node;
  };

  /**
   * Get animation frames for a specific direction
   */
  public static getDirectionFrames = (direction: RunningDirection): Array<string> => {
    return RunningSprite.animations[`running-${direction}`] || [];
  }

  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the running sprite sheet
   * Sheet: 1936x1056 pixels, 8 rows x 22 columns
   * Tile size: 88x132 pixels (1936/22 = 88, 1056/8 = 132)
   */
  public static atlas: SpriteAtlasData = {
    frames: (() => {
      const frames: Record<string, any> = {};
      const tileWidth = 88; // 1936 / 22
      const tileHeight = 132; // 1056 / 8
      
      // Generate frames for all 8 rows (directions) and 22 columns (animation frames)
      const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] as const;
      
      for (let row = 0; row < 8; row++) {
        const direction = directions[row];
        for (let col = 0; col < 22; col++) {
          const frameName = `running-${direction}-${col}` as const;
          frames[frameName] = {
            frame: { 
              x: col * tileWidth, 
              y: row * tileHeight, 
              width: tileWidth, 
              height: tileHeight 
            },
            sourceSize: { w: tileWidth, h: tileHeight },
            spriteSourceSize: { x: 0, y: 0, width: tileWidth, height: tileHeight },
          };
        }
      }
      
      return frames;
    })(),
    meta: {
      image: RunningSheet,
      size: { w: 1936, h: 1056 },
      scale: 1
    }
  };

  // Animation configuration - separate from atlas data
  public static animations = (() => {
    const animations: Record<string, Array<string>> = {};
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] as const;
    
    // Create animation arrays for each direction
    for (const direction of directions) {
      animations[`running-${direction}`] = [];
      for (let i = 0; i < 22; i++) {
        animations[`running-${direction}`].push(`running-${direction}-${i}`);
      }
    }
    
    return animations;
  })();

  /**
   * Get animation frame arrays
   */
  public static getAnimations = () => {
    return RunningSprite.animations;
  };

  // PIXI.js compatibility method for existing code
  public static getSpriteSheet = () => {
    return {
      animations: RunningSprite.animations
    };
  };
}