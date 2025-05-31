/***** TYPE DEFINITIONS *****/
export interface WebGLContextOptions {
  alpha?: boolean;
  antialias?: boolean;
  depth?: boolean;
  stencil?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
}

/***** WEBGL CONTEXT MANAGER *****/
export class WebGLContext {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private extensions: Map<string, any> = new Map();
  private isContextLost = false;

  constructor(canvas: HTMLCanvasElement, options: WebGLContextOptions = {}) {
    this.canvas = canvas;
    
    const contextOptions = {
      alpha: options.alpha ?? true,
      antialias: options.antialias ?? true,
      depth: options.depth ?? false,
      stencil: options.stencil ?? false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference ?? 'high-performance',
    };

    const gl = canvas.getContext('webgl', contextOptions) || 
               canvas.getContext('experimental-webgl', contextOptions);
    
    if (!gl) {
      throw new Error('WebGL is not supported in this browser');
    }

    this.gl = gl as WebGLRenderingContext;
    this.setupContextLossHandling();
    this.loadExtensions();
    this.setupDefaultState();
  }

  /***** CONTEXT MANAGEMENT *****/
  private setupContextLossHandling(): void {
    this.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.isContextLost = true;
      console.warn('WebGL context lost');
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false;
      this.loadExtensions();
      this.setupDefaultState();
      console.log('WebGL context restored');
    });
  }

  private loadExtensions(): void {
    const extensionNames = [
      'OES_vertex_array_object',
      'WEBGL_lose_context',
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_depth_texture',
    ];

    for (const name of extensionNames) {
      const extension = this.gl.getExtension(name);
      if (extension) {
        this.extensions.set(name, extension);
      }
    }
  }

  private setupDefaultState(): void {
    const gl = this.gl;
    
    // Enable blending for sprites
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Set clear color to transparent
    gl.clearColor(0, 0, 0, 0);
    
    // Disable depth testing for 2D rendering
    gl.disable(gl.DEPTH_TEST);
    
    // Set viewport
    this.setViewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /***** PUBLIC API *****/
  public getContext(): WebGLRenderingContext {
    if (this.isContextLost) {
      throw new Error('WebGL context is lost');
    }
    return this.gl;
  }

  public getExtension(name: string): any {
    return this.extensions.get(name);
  }

  public hasExtension(name: string): boolean {
    return this.extensions.has(name);
  }

  public setViewport(x: number, y: number, width: number, height: number): void {
    this.gl.viewport(x, y, width, height);
  }

  public clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.setViewport(0, 0, width, height);
  }

  public isLost(): boolean {
    return this.isContextLost;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /***** DEBUGGING *****/
  public getInfo(): Record<string, any> {
    const gl = this.gl;
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      extensions: Array.from(this.extensions.keys()),
    };
  }
}
