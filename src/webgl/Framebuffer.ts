/***** TYPE DEFINITIONS *****/
export interface FramebufferOptions {
  width: number;
  height: number;
  colorFormat?: number;
  hasDepth?: boolean;
  hasStencil?: boolean;
}

/***** FRAMEBUFFER CLASS *****/
export class Framebuffer {
  private gl: WebGLRenderingContext;
  private framebuffer: WebGLFramebuffer;
  private colorTexture: WebGLTexture;
  private depthBuffer?: WebGLRenderbuffer;
  private width: number;
  private height: number;

  constructor(gl: WebGLRenderingContext, options: FramebufferOptions) {
    this.gl = gl;
    this.width = options.width;
    this.height = options.height;

    // Create framebuffer
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error('Failed to create WebGL framebuffer');
    }
    this.framebuffer = framebuffer;

    // Create color texture
    const colorTexture = gl.createTexture();
    if (!colorTexture) {
      throw new Error('Failed to create color texture for framebuffer');
    }
    this.colorTexture = colorTexture;

    this.setupFramebuffer(options);
  }

  /***** FRAMEBUFFER SETUP *****/
  private setupFramebuffer(options: FramebufferOptions): void {
    const gl = this.gl;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    // Setup color texture
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Attach color texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);

    // Setup depth buffer if requested
    if (options.hasDepth) {
      const depthBuffer = gl.createRenderbuffer();
      if (!depthBuffer) {
        throw new Error('Failed to create depth buffer for framebuffer');
      }
      
      this.depthBuffer = depthBuffer;
      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    }

    // Check framebuffer completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer is not complete: ${status}`);
    }

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (this.depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  }

  /***** PUBLIC API *****/
  public bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.width, this.height);
  }

  public unbind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public clear(r = 0, g = 0, b = 0, a = 0): void {
    this.bind();
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | (this.depthBuffer ? this.gl.DEPTH_BUFFER_BIT : 0));
  }

  public getColorTexture(): WebGLTexture {
    return this.colorTexture;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const gl = this.gl;
    
    // Resize color texture
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    // Resize depth buffer if it exists
    if (this.depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    }
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    if (this.depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  }

  /**
   * Convert the framebuffer to a WebGL texture
   * @returns WebGL texture object
   */
  public toTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture from framebuffer');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    return texture;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer);
    }
    if (this.colorTexture) {
      this.gl.deleteTexture(this.colorTexture);
    }
    if (this.depthBuffer) {
      this.gl.deleteRenderbuffer(this.depthBuffer);
    }
  }
}
