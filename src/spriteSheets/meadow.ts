/***** TYPE DEFINITIONS *****/
import { Assets, Container, RenderTexture, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import MeadowSpritesAsset from '../assets/meadow-sprites.png';

/***** MEADOW SPRITE CLASS *****/
export class MeadowSprite {
  private static __spriteSheet: Spritesheet | null = null;
  private static size = 250; 
  private static spritePools: Map<number, Sprite[]> = new Map();
  private static MAX_POOL_SIZE = 256; // Maximum sprites per pool

  /**
   * Load the meadow sprite sheet
   */
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

  /**
   * Get the loaded sprite sheet
   */
  public static getSpriteSheet = (): Spritesheet => {
    invariant(MeadowSprite.__spriteSheet, "Meadow sprite sheet not loaded");
    return MeadowSprite.__spriteSheet;
  };

  /**
   * Create a sprite from a specific frame
   */
  public static createSprite = (name: keyof typeof MeadowSprite.atlas['frames']): Sprite => {
    invariant(MeadowSprite.__spriteSheet, "Meadow sprite sheet not loaded");
    return new Sprite(
      MeadowSprite.__spriteSheet.textures[name]
    );
  };

  /**
   * Get a sprite by index (0-5)
   */
  public static getSpriteByIndex = (index: number): Sprite => {
    invariant(index >= 0 && index <= 5, `Invalid sprite index: ${index}. Must be 0-5.`);
    const spriteName = `meadow-${index}` as keyof typeof MeadowSprite.atlas['frames'];
    return MeadowSprite.createSprite(spriteName);
  };

    /***** SPRITE POOLING METHODS *****/
  /**
   * Borrow a sprite from the pool for the given sprite index
   * Creates a new sprite if pool is empty
   */
  private static borrowSprite = (spriteIndex: number): Sprite => {
    // Ensure pool exists for this sprite index
    if (!MeadowSprite.spritePools.has(spriteIndex)) {
      MeadowSprite.spritePools.set(spriteIndex, []);
    }

    const pool = MeadowSprite.spritePools.get(spriteIndex)!;
    
    // Try to reuse from pool, otherwise create new
    const sprite = pool.length > 0 
      ? pool.pop()! 
      : MeadowSprite.getSpriteByIndex(spriteIndex);

    // Reset sprite to default state
    sprite.x = 0;
    sprite.y = 0;
    sprite.scale.set(1);
    sprite.parent?.removeChild(sprite);

    return sprite;
  };

  /**
   * Return a sprite to its pool for reuse
   */
  private static returnSprite = (sprite: Sprite, spriteIndex: number): void => {
    // Remove from any container
    sprite.parent?.removeChild(sprite);
    
    // Reset sprite state
    sprite.x = 0;
    sprite.y = 0;
    sprite.scale.set(1);

    // Return to pool if there's space
    const pool = MeadowSprite.spritePools.get(spriteIndex);
    if (pool && pool.length < MeadowSprite.MAX_POOL_SIZE) {
      pool.push(sprite);
    }
    // If pool is full, allow sprite to be garbage collected
  };

  /**
   * Create an optimized chunk background texture from sprite indices
   * @param spriteData - Array of sprite data with positions and indices
   * @param renderer - PIXI renderer for texture generation
   * @param chunkSize - Size of the chunk in pixels (typically 1024)
   * @param tileSize - Size of each tile in pixels (typically 64)
   * @returns Rendered texture containing all sprites
   */
  public static createChunkTexture = (
    spriteData: Array<{ x: number, y: number, spriteIndex: number }>,
    renderer: any,
    chunkSize: number,
    tileSize: number
  ): RenderTexture => {
    // Create a temporary container for staging sprites
    const tempContainer = new Container();
    
    // Create render texture for the chunk
    const renderTexture = RenderTexture.create({
      width: chunkSize,
      height: chunkSize,
    });

    const borrowedSprites: { sprite: Sprite, index: number }[] = [];
    
    // Add all sprites to the temporary container
    for (const data of spriteData) {
      const sprite = MeadowSprite.borrowSprite(data.spriteIndex);
      borrowedSprites.push({ sprite, index: data.spriteIndex });
      
      // Scale sprite from 270x270 to tile MeadowSprite.size (64x64)
      const scale = tileSize / MeadowSprite.size;
      sprite.scale.set(scale);
      
      // Position sprite
      sprite.x = data.x;
      sprite.y = data.y;
      
      tempContainer.addChild(sprite);
    }

    // Render all sprites to the render texture
    renderer.render(tempContainer, { renderTexture });

    for (const { index, sprite } of borrowedSprites) {
      MeadowSprite.returnSprite(sprite, index);
    }

    // Clean up temporary container
    tempContainer.destroy({ children: false });

    return renderTexture;
  };

  // Size of each sprite in the atlas
  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the meadow sprite sheet
   * Sheet: 1024x1024 pixels, 6 sprites arranged in 2 rows x 3 columns
   * Sprite MeadowSprite.size: 270x270 pixels each
   */
  public static atlas = {
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
