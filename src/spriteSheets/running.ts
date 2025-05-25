import { Assets, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import RunningSheet from '../assets/level1_running.png';

/***** TYPE DEFINITIONS *****/
type RunningDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';

/***** RUNNING SPRITE CLASS *****/
export class RunningSprite {
  private static __spriteSheet: Spritesheet | null = null;

  /**
   * Load the running sprite sheet assets
   */
  public static load = async () => {
    // Load the asset sheet
    await Assets.load(RunningSprite.atlas.meta.image);

    // Create a spritesheet
    const runningSpriteSheet = new Spritesheet(
      Texture.from(RunningSprite.atlas.meta.image),
      RunningSprite.atlas
    );

    // Parse the spritesheet
    await runningSpriteSheet.parse();

    // Set the sprite sheet
    RunningSprite.__spriteSheet = runningSpriteSheet;
  }

  /**
   * Get the loaded sprite sheet
   */
  public static getSpriteSheet = () => {
    invariant(RunningSprite.__spriteSheet, "Running sprite sheet not loaded");
    return RunningSprite.__spriteSheet;
  }

  /**
   * Create a sprite from the running sheet
   */
  public static createSprite = (name: keyof typeof RunningSprite.atlas['frames']) => {
    invariant(RunningSprite.__spriteSheet, "Running sprite sheet not loaded");
    return new Sprite(
      RunningSprite.__spriteSheet.textures[name]
    );
  }

  /**
   * Get animation frames for a specific direction
   */
  public static getDirectionFrames = (direction: RunningDirection): string[] => {
    return RunningSprite.atlas.animations[`running-${direction}`] || [];
  }

  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the running sprite sheet
   * Sheet: 1936x1056 pixels, 8 rows x 22 columns
   * Tile size: 88x132 pixels (1936/22 = 88, 1056/8 = 132)
   */
  public static atlas = {
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
              w: tileWidth, 
              h: tileHeight 
            },
            sourceSize: { w: tileWidth, h: tileHeight },
            spriteSourceSize: { x: 0, y: 0, w: tileWidth, h: tileHeight },
          };
        }
      }
      
      return frames;
    })(),
    meta: {
      image: RunningSheet,
      size: { w: 1936, h: 1056 },
      scale: 1
    },
    animations: (() => {
      const animations: Record<string, string[]> = {};
      const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] as const;
      
      // Create animation arrays for each direction
      for (const direction of directions) {
        animations[`running-${direction}`] = [];
        for (let i = 0; i < 22; i++) {
          animations[`running-${direction}`].push(`running-${direction}-${i}`);
        }
      }
      
      return animations;
    })()
  }
}