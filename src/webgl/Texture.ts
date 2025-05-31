/***** TYPE DEFINITIONS *****/
export interface TextureOptions {
  width?: number;
  height?: number;
  format?: number;
  type?: number;
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  generateMipmaps?: boolean;
}

/***** TEXTURE CLASS *****/
export class WebGLTexture {
  private gl: WebGLRenderingContext;
  private texture: globalThis.WebGLTexture;
  private width: number = 0;
  private height: number = 0;
  private isLoaded = false;

  constructor(gl: WebGLRenderingContext, options: TextureOptions = {}) {
    this.gl = gl;
    
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create WebGL texture');
    }
    
    this.texture = texture;
    this.setupTexture(options);
  }

  /***** TEXTURE SETUP *****/
  private setupTexture(options: TextureOptions): void {
    const gl = this.gl;
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    // Set texture parameters
    const minFilter = options.minFilter ?? gl.LINEAR;
    const magFilter = options.magFilter ?? gl.LINEAR;
    const wrapS = options.wrapS ?? gl.CLAMP_TO_EDGE;
    const wrapT = options.wrapT ?? gl.CLAMP_TO_EDGE;
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    
    // Create empty texture if dimensions provided
    if (options.width && options.height) {
      this.createEmpty(options.width, options.height, options);
    }
  }

  /***** TEXTURE LOADING *****/
  public loadFromImage(image: HTMLImageElement | HTMLCanvasElement | ImageData): void {
    const gl = this.gl;
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, image);
    
    this.width = image.width;
    this.height = image.height;
    this.isLoaded = true;
    
    // Generate mipmaps if power of 2
    if (this.isPowerOf2(this.width) && this.isPowerOf2(this.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
  }

  public async loadFromURL(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        try {
          this.loadFromImage(image);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      image.onerror = () => {
        reject(new Error(`Failed to load image from ${url}`));
      };
      
      image.crossOrigin = 'anonymous';
      image.src = url;
    });
  }

  public createEmpty(width: number, height: number, options: TextureOptions = {}): void {
    const gl = this.gl;
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    const format = options.format ?? gl.RGBA;
    const type = options.type ?? gl.UNSIGNED_BYTE;
    
    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
    
    this.width = width;
    this.height = height;
    this.isLoaded = true;
  }

  public updateSubImage(x: number, y: number, width: number, height: number, data: ArrayBufferView): void {
    const gl = this.gl;
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  /***** TEXTURE ATLAS SUPPORT *****/
  public static createAtlas(gl: WebGLRenderingContext, images: Array<HTMLImageElement>, maxSize = 2048): WebGLTexture {
    // Simple atlas packing - arrange images in a grid
    const numImages = images.length;
    const cols = Math.ceil(Math.sqrt(numImages));
    const rows = Math.ceil(numImages / cols);
    
    const imageWidth = images[0]?.width ?? 0;
    const imageHeight = images[0]?.height ?? 0;
    
    const atlasWidth = Math.min(cols * imageWidth, maxSize);
    const atlasHeight = Math.min(rows * imageHeight, maxSize);
    
    const canvas = document.createElement('canvas');
    canvas.width = atlasWidth;
    canvas.height = atlasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for atlas creation');
    }
    
    // Draw images to canvas
    images.forEach((image, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * imageWidth;
      const y = row * imageHeight;
      
      ctx.drawImage(image, x, y);
    });
    
    const texture = new WebGLTexture(gl);
    texture.loadFromImage(canvas);
    
    return texture;
  }

  /***** PUBLIC API *****/
  public bind(unit = 0): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  public unbind(): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public isReady(): boolean {
    return this.isLoaded;
  }

  public getTexture(): globalThis.WebGLTexture {
    return this.texture;
  }

  /***** UTILITIES *****/
  private isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
    }
  }
}
