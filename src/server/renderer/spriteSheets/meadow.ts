import { Assets, Container, RenderTexture, Sprite, Spritesheet, Texture, type ICanvas, type IRenderer } from '@pixi/node';
import path from 'path';
import invariant from "tiny-invariant";
import { fileURLToPath } from 'url';

/***** TYPE DEFINITIONS *****/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/***** MEADOW SPRITE CLASS *****/
export class ServerMeadowSprite {
  private static __spriteSheet: Spritesheet | null = null;
  private static size = 250; 

  /**
   * Load the meadow sprite sheet
   */
  public static load = async (): Promise<void> => {
    // Load the asset sheet using file path (navigate up to project root)
    const assetPath = path.resolve(__dirname, '../../../assets/meadow-sprites.png');
    await Assets.load(assetPath);

    // Create a spritesheet
    const meadowSpriteSheet = new Spritesheet(
      Texture.from(assetPath),
      ServerMeadowSprite.atlas
    );

    // Parse the spritesheet
    await meadowSpriteSheet.parse();

    // Set the sprite sheet
    ServerMeadowSprite.__spriteSheet = meadowSpriteSheet;
  };

  /**
   * Get the loaded sprite sheet
   */
  public static getSpriteSheet = (): Spritesheet => {
    invariant(ServerMeadowSprite.__spriteSheet, "Meadow sprite sheet not loaded");
    return ServerMeadowSprite.__spriteSheet;
  };

  /**
   * Create a sprite from a specific frame
   */
  public static createSprite = (name: keyof typeof ServerMeadowSprite.atlas['frames']): Sprite => {
    invariant(ServerMeadowSprite.__spriteSheet, "Meadow sprite sheet not loaded");
    return new Sprite(
      ServerMeadowSprite.__spriteSheet.textures[name]
    );
  };

  /**
   * Get a sprite by index (0-5)
   */
  public static getSpriteByIndex = (index: number): Sprite => {
    invariant(index >= 0 && index <= 5, `Invalid sprite index: ${index}. Must be 0-5.`);
    const spriteName = `meadow-${index}` as keyof typeof ServerMeadowSprite.atlas['frames'];
    return ServerMeadowSprite.createSprite(spriteName);
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
    renderer: IRenderer<ICanvas>,
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

    // Add all sprites to the temporary container
    for (const data of spriteData) {
      const sprite = ServerMeadowSprite.getSpriteByIndex(data.spriteIndex);
      
      // Scale sprite from 270x270 to tile size (64x64)
      const scale = tileSize / ServerMeadowSprite.size;
      sprite.scale.set(scale);
      
      // Position sprite
      sprite.x = data.x;
      sprite.y = data.y;
      
      tempContainer.addChild(sprite);
    }

    // Render all sprites to the render texture
    renderer.render(tempContainer, { renderTexture });

    // Clean up temporary container
    tempContainer.destroy({ children: true })

    return renderTexture;
  };

  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the meadow sprite sheet
   * Sheet: 1024x1024 pixels, 6 sprites arranged in 2 rows x 3 columns
   * Sprite size: 270x270 pixels each
   */
  public static atlas = {
    frames: {
      "meadow-0": {
        frame: { x: 64, y: 116, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        sourceSize: { w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
      },
      "meadow-1": {
        frame: { x: 384, y: 116, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        sourceSize: { w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
      },
      "meadow-2": {
        frame: { x: 688, y: 116, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        sourceSize: { w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
      },
      "meadow-3": {
        frame: { x: 64, y: 422, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        sourceSize: { w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
      },
      "meadow-4": {
        frame: { x: 384, y: 422, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        sourceSize: { w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
      },
      "meadow-5": {
        frame: { x: 688, y: 422, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        sourceSize: { w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, w: ServerMeadowSprite.size, h: ServerMeadowSprite.size },
      }
    },
    meta: {
      image: path.resolve(__dirname, '../../../assets/meadow-sprites.png'),
      size: { w: 1024, h: 1024 },
      scale: 1
    },
    animations: {}
  };
}
