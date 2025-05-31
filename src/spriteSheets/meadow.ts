/***** TYPE DEFINITIONS *****/
import invariant from "tiny-invariant";
import { SpriteAtlas } from '../sprites/SpriteAtlas';
import type { SpriteAtlasData } from '../sprites/SpriteAtlas';
import { SceneNode } from '../sprites/SceneGraph';
import { SpriteRenderer } from '../sprites/SpriteRenderer';
import { Framebuffer } from '../webgl/Framebuffer';
import { WebGLRenderer } from '../webgl/WebGLRenderer';
import MeadowSpritesAsset from '../assets/meadow-sprites.png';

/***** MEADOW SPRITE CLASS *****/
export class MeadowSprite {
  private static __spriteAtlas: SpriteAtlas | null = null;
  public static size = 250; 

  /**
   * Load the meadow sprite atlas
   */
  public static load = async (): Promise<void> => {
    throw new Error("Use loadWithGL method for WebGL rendering");
  };

  /**
   * Load the meadow sprite atlas with WebGL context
   */
  public static loadWithGL = async (gl: WebGLRenderingContext): Promise<void> => {
    // Create sprite atlas with WebGL context
    const meadowSpriteAtlas = new SpriteAtlas(gl);

    // Load using our atlas data
    await meadowSpriteAtlas.loadFromData(MeadowSprite.atlas);

    // Set the sprite atlas
    MeadowSprite.__spriteAtlas = meadowSpriteAtlas;
  };

  /**
   * Get the loaded sprite atlas
   */
  public static getAtlas = (): SpriteAtlas => {
    invariant(MeadowSprite.__spriteAtlas, "Meadow sprite atlas not loaded");
    return MeadowSprite.__spriteAtlas;
  };

  /**
   * Create a sprite node from a specific frame
   */
  public static createSprite = (name: keyof typeof MeadowSprite.atlas['frames']): SceneNode => {
    invariant(MeadowSprite.__spriteAtlas, "Meadow sprite atlas not loaded");
    
    // Create scene node for WebGL rendering
    const node = new SceneNode();
    
    // Set texture and size
    node.setTexture(MeadowSprite.__spriteAtlas, name, MeadowSprite.size, MeadowSprite.size);

    return node;
  };

  /**
   * Get a sprite by index (0-5)
   */
  public static getSpriteByIndex = (index: number): SceneNode => {
    invariant(index >= 0 && index <= 5, `Invalid sprite index: ${index}. Must be 0-5.`);
    const spriteName = `meadow-${index}` as keyof typeof MeadowSprite.atlas['frames'];
    return MeadowSprite.createSprite(spriteName);
  };

  /**
   * Create an optimized chunk background texture from sprite indices
   * @param spriteData - Array of sprite data with positions and indices
   * @param renderer - WebGL renderer for texture generation
   * @param chunkSize - Size of the chunk in pixels (typically 1024)
   * @param tileSize - Size of each tile in pixels (typically 64)
   * @returns Framebuffer containing all sprites rendered to texture
   */
  public static createChunkTexture = async (
    spriteData: Array<{ x: number, y: number, spriteIndex: number }>,
    renderer: WebGLRenderer,
    chunkSize: number,
    tileSize: number
  ): Promise<Framebuffer> => {
    // Create framebuffer for render-to-texture
    const framebuffer = new Framebuffer(renderer.getGL(), {
      width: chunkSize,
      height: chunkSize,
    });

    // Bind framebuffer for rendering
    framebuffer.bind();
    framebuffer.clear(0, 0, 0, 0);

    // Create temporary sprite renderer for chunk generation
    const spriteRenderer = new SpriteRenderer(renderer);
    
    // Add all sprites to scene for batch rendering
    for (const data of spriteData) {
      const spriteNode = MeadowSprite.getSpriteByIndex(data.spriteIndex);
      
      // Scale sprite from 250x250 to tile size (64x64)
      const scale = tileSize / MeadowSprite.size;
      spriteNode.transform.setScale(scale);
      
      // Position sprite
      spriteNode.transform.setPosition(data.x, data.y);
      
      spriteRenderer.addToScene(spriteNode);
    }

    // Render all sprites to the framebuffer
    spriteRenderer.render();

    // Unbind framebuffer
    framebuffer.unbind();

    // Clean up temporary renderer
    spriteRenderer.destroy();

    return framebuffer;
  };

  // Size of each sprite in the atlas
  /***** SPRITE ATLAS CONFIGURATION *****/
  /**
   * Atlas configuration for the meadow sprite sheet
   * Sheet: 1024x1024 pixels, 6 sprites arranged in 2 rows x 3 columns
   * Sprite size: 250x250 pixels each
   */
  public static atlas: SpriteAtlasData = {
    frames: {
      "meadow-0": {
        frame: { x: 64, y: 116, width: MeadowSprite.size, height: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, width: MeadowSprite.size, height: MeadowSprite.size },
      },
      "meadow-1": {
        frame: { x: 384, y: 116, width: MeadowSprite.size, height: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, width: MeadowSprite.size, height: MeadowSprite.size },
      },
      "meadow-2": {
        frame: { x: 688, y: 116, width: MeadowSprite.size, height: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, width: MeadowSprite.size, height: MeadowSprite.size },
      },
      "meadow-3": {
        frame: { x: 64, y: 422, width: MeadowSprite.size, height: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, width: MeadowSprite.size, height: MeadowSprite.size },
      },
      "meadow-4": {
        frame: { x: 384, y: 422, width: MeadowSprite.size, height: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, width: MeadowSprite.size, height: MeadowSprite.size },
      },
      "meadow-5": {
        frame: { x: 688, y: 422, width: MeadowSprite.size, height: MeadowSprite.size },
        sourceSize: { w: MeadowSprite.size, h: MeadowSprite.size },
        spriteSourceSize: { x: 0, y: 0, width: MeadowSprite.size, height: MeadowSprite.size },
      }
    },
    meta: {
      image: MeadowSpritesAsset,
      size: { w: 1024, h: 1024 },
      scale: 1
    },
  };
}
