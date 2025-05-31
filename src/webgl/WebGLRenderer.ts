/***** TYPE DEFINITIONS *****/
import { WebGLContext, type WebGLContextOptions } from './WebGLContext';
import { Transform } from './Transform';
import { Chunk } from '../systems/chunkManager/chunk';

export interface RendererOptions extends WebGLContextOptions {
  width?: number;
  height?: number;
  backgroundColor?: [number, number, number, number];
  pixelRatio?: number;
}

export interface RenderStats {
  drawCalls: number;
  triangles: number;
  vertices: number;
  textures: number;
}

/***** MAIN WEBGL RENDERER *****/
export class WebGLRenderer {
  private context!: WebGLContext;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private backgroundColor: [number, number, number, number];
  private projectionMatrix: Float32Array;
  private viewMatrix: Float32Array;
  private stats: RenderStats = { drawCalls: 0, triangles: 0, vertices: 0, textures: 0 };
  private scene?: any; // Scene root node

  constructor(options: RendererOptions = {}) {
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    this.pixelRatio = options.pixelRatio ?? window.devicePixelRatio ?? 1;
    this.backgroundColor = options.backgroundColor ?? [0, 0, 0, 1];

    // Create canvas
    this.canvas = document.createElement('canvas');
    
    // Initialize matrices
    this.projectionMatrix = Transform.createProjection(this.width, this.height);
    this.viewMatrix = Transform.createIdentity();
  }

  /***** INITIALIZATION *****/
  public async initialize(parentElement: HTMLElement): Promise<void> {
    // Setup canvas
    this.setupCanvas();
    
    // Append to parent element
    parentElement.appendChild(this.canvas);
    
    // Create WebGL context
    this.context = new WebGLContext(this.canvas);
    
    // Setup initial state
    this.setupInitialState();
  }

  /***** SCENE MANAGEMENT *****/
  public setScene(scene: any): void {
    this.scene = scene;
  }

  public getScene(): any {
    return this.scene;
  }

  /***** RENDER METHODS *****/
  public render(): void {
    this.startFrame();
    
    // Render the scene if available
    if (this.scene) {
      // TODO: Implement scene rendering
      // This would traverse the scene graph and render sprites
    }
    
    this.endFrame();
  }

  public updateProjection(): void {
    this.setProjection(this.width, this.height);
  }

  public handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.resize(rect.width, rect.height);
  }

  /***** SETUP METHODS *****/
  private setupCanvas(): void {
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  private setupInitialState(): void {
    const gl = this.context.getContext();
    
    // Set viewport
    this.context.setViewport(0, 0, this.canvas.width, this.canvas.height);
    
    // Enable blending for sprites
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Disable depth testing for 2D
    gl.disable(gl.DEPTH_TEST);
    
    // Set clear color
    this.setClearColor(...this.backgroundColor);
  }

  /***** RENDER LOOP *****/
  public startFrame(): void {
    this.resetStats();
    this.clear();
  }

  public endFrame(): void {
    // Frame complete - stats are finalized
  }

  public clear(): void {
    this.context.clear();
  }

  public setClearColor(r: number, g: number, b: number, a: number): void {
    this.backgroundColor = [r, g, b, a];
    const gl = this.context.getContext();
    gl.clearColor(r, g, b, a);
  }

  /***** CAMERA AND PROJECTION *****/
  public setCamera(transform: Transform): void {
    const matrix = transform.getMatrix();
    
    // Invert the transform for view matrix (camera moves opposite to world)
    this.viewMatrix[0] = matrix[0];   this.viewMatrix[3] = matrix[3];   this.viewMatrix[6] = -matrix[6];
    this.viewMatrix[1] = matrix[1];   this.viewMatrix[4] = matrix[4];   this.viewMatrix[7] = -matrix[7];
    this.viewMatrix[2] = matrix[2];   this.viewMatrix[5] = matrix[5];   this.viewMatrix[8] = matrix[8];
  }

  public setProjection(width: number, height: number): void {
    this.projectionMatrix = Transform.createProjection(width, height);
  }

  public getProjectionMatrix(): Float32Array {
    return this.projectionMatrix;
  }

  public getViewMatrix(): Float32Array {
    return this.viewMatrix;
  }

  /***** VIEWPORT AND SIZING *****/
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    this.setupCanvas();
    this.context.resize(this.canvas.width, this.canvas.height);
    this.setProjection(width, height);
  }

  public getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): WebGLContext {
    return this.context;
  }

  public getGL(): WebGLRenderingContext {
    return this.context.getContext();
  }

  /***** RENDER STATISTICS *****/
  public addDrawCall(triangles: number, vertices: number): void {
    this.stats.drawCalls++;
    this.stats.triangles += triangles;
    this.stats.vertices += vertices;
  }

  public addTextureBinding(): void {
    this.stats.textures++;
  }

  public getStats(): RenderStats {
    return { ...this.stats };
  }

  private resetStats(): void {
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;
    this.stats.vertices = 0;
    this.stats.textures = 0;
  }

  /***** DEBUGGING *****/
  public getInfo(): Record<string, any> {
    return {
      ...this.context.getInfo(),
      canvas: {
        width: this.canvas.width,
        height: this.canvas.height,
        displayWidth: this.width,
        displayHeight: this.height,
        pixelRatio: this.pixelRatio,
      },
      backgroundColor: this.backgroundColor,
    };
  }

  /***** CLEANUP *****/
  public destroy(): void {
    // Remove canvas from DOM
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    // Context cleanup is handled automatically
    // Additional cleanup can be added here if needed
  }

  /***** CHUNK RENDERING *****/
  /**
   * Draw a chunk using WebGL
   * @param chunk - The chunk to render
   */
  public drawChunk(chunk: Chunk): void {
    // Logic to render the chunk using WebGL
    console.log(`Rendering chunk at position (${chunk.chunkPosition.x}, ${chunk.chunkPosition.y})`);
  }
}