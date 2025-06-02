import { Application, Assets, Container, RenderTexture, Sprite } from '@pixi/node';
import { ImageData } from 'canvas';
import { SpriteSheets } from './spriteSheets';

// @ts-ignore
global.ImageData = ImageData

/***** TYPE DEFINITIONS *****/
type Base64URLString = string;

/***** SERVER CHUNK RENDERER *****/
class ServerChunkRenderer {
  private application!: Application;
  private renderTexture: RenderTexture = RenderTexture.create({
    width: 1024,
    height: 1024,
  });

  constructor() {}

  public initialize = async () => {
    // This package requires the new asset loader to be used.
    // Initialize the new assets loader
    await Assets.init();

    // The application will create a renderer using WebGL. It will also setup the ticker
    // and the root stage Container.
    this.application = new Application();

    // Load in our sprites
    await SpriteSheets.ServerSpruceTreeSprite.load();
    await SpriteSheets.ServerMeadowSprite.load();
  };

  public textureToDataURL = async (texture: RenderTexture): Promise<Base64URLString> => {

    // const pixels = new Uint8ClampedArray(this.application.renderer.extract.pixels(this.application.stage));
    // const imageData = new ImageData(pixels, 1024, 1024);

    // const canvas = new Canvas(1024, 1024);
    // const ctxt = canvas.getContext('2d');
    // ctxt.putImageData(imageData, 0, 0);


    // Create a temporary container for staging sprites
    const tempContainer = new Container();

    // Create a sprite from the texture
    const sprite = new Sprite(texture);

    // Add the sprite to the container
    tempContainer.addChild(sprite);

    // Render all sprites to the render texture
    this.application.renderer.render(tempContainer, { renderTexture: this.renderTexture });

    // Convert the render texture to a data URL
    const data = this.application.renderer.extract.base64(this.renderTexture);

    return data;
  }

  /**
   * Create an optimized chunk texture from meadow sprites
   */
  public generateChunkTexture = (
    spriteData: Array<{ x: number, y: number, spriteIndex: number }>,
    chunkSize: number = 1024,
    tileSize: number = 64
  ): RenderTexture => {
    return SpriteSheets.ServerMeadowSprite.createChunkTexture(
      spriteData,
      this.application.renderer,
      chunkSize,
      tileSize
    );
  };
}

export { ServerChunkRenderer };
