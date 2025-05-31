/***** TYPE DEFINITIONS *****/
import { WebGLTexture } from '../webgl/Texture';

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteAtlasFrame {
  frame: SpriteFrame;
  sourceSize: { w: number; h: number };
  spriteSourceSize: SpriteFrame;
}

export interface SpriteAtlasData {
  frames: Record<string, SpriteAtlasFrame>;
  meta: {
    image: string;
    size: { w: number; h: number };
    scale: number;
  };
}

/***** SPRITE ATLAS CLASS *****/
export class SpriteAtlas {
  private texture: WebGLTexture;
  private frames: Map<string, SpriteAtlasFrame> = new Map();
  private isLoaded = false;

  constructor(private _gl: WebGLRenderingContext) {
    this.texture = new WebGLTexture(_gl);
  }

  /***** ATLAS LOADING *****/
  public async loadFromData(atlasData: SpriteAtlasData): Promise<void> {
    // Load texture from image URL
    await this.texture.loadFromURL(atlasData.meta.image);
    
    // Store frame data
    for (const [name, frameData] of Object.entries(atlasData.frames)) {
      this.frames.set(name, frameData);
    }
    
    this.isLoaded = true;
  }

  public async loadFromImage(image: HTMLImageElement, frames: Record<string, SpriteAtlasFrame>): Promise<void> {
    this.texture.loadFromImage(image);
    
    for (const [name, frameData] of Object.entries(frames)) {
      this.frames.set(name, frameData);
    }
    
    this.isLoaded = true;
  }

  /***** FRAME ACCESS *****/
  public getFrame(name: string): SpriteAtlasFrame | undefined {
    return this.frames.get(name);
  }

  public hasFrame(name: string): boolean {
    return this.frames.has(name);
  }

  public getFrameNames(): Array<string> {
    return Array.from(this.frames.keys());
  }

  /***** TEXTURE COORDINATES *****/
  public getTextureCoords(name: string): Array<number> | undefined {
    const frame = this.frames.get(name);
    if (!frame) return undefined;

    const textureWidth = this.texture.getWidth();
    const textureHeight = this.texture.getHeight();
    
    const x1 = frame.frame.x / textureWidth;
    const y1 = frame.frame.y / textureHeight;
    const x2 = (frame.frame.x + frame.frame.width) / textureWidth;
    const y2 = (frame.frame.y + frame.frame.height) / textureHeight;
    
    // Return UV coordinates for a quad (bottom-left, bottom-right, top-right, top-left)
    return [
      x1, y2,  // bottom-left
      x2, y2,  // bottom-right
      x2, y1,  // top-right
      x1, y1   // top-left
    ];
  }

  public getNormalizedFrame(name: string): { x: number; y: number; width: number; height: number } | undefined {
    const frame = this.frames.get(name);
    if (!frame) return undefined;

    const textureWidth = this.texture.getWidth();
    const textureHeight = this.texture.getHeight();
    
    return {
      x: frame.frame.x / textureWidth,
      y: frame.frame.y / textureHeight,
      width: frame.frame.width / textureWidth,
      height: frame.frame.height / textureHeight,
    };
  }

  /***** PUBLIC API *****/
  public getTexture(): WebGLTexture {
    return this.texture;
  }

  public isReady(): boolean {
    return this.isLoaded && this.texture.isReady();
  }

  public bind(unit = 0): void {
    this.texture.bind(unit);
  }

  public unbind(): void {
    this.texture.unbind();
  }

  /***** STATIC UTILITIES *****/
  public static createFromPIXIAtlas(gl: WebGLRenderingContext, pixiAtlasData: any): SpriteAtlas {
    const atlas = new SpriteAtlas(gl);
    
    // Convert PIXI atlas format to our format
    const atlasData: SpriteAtlasData = {
      frames: pixiAtlasData.frames,
      meta: pixiAtlasData.meta,
    };
    
    atlas.loadFromData(atlasData);
    return atlas;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    this.texture.destroy();
    this.frames.clear();
  }
}
