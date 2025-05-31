/***** TYPE DEFINITIONS *****/
export interface BufferOptions {
  usage?: number;
  target?: number;
}

/***** BUFFER CLASS *****/
export class Buffer {
  protected gl: WebGLRenderingContext;
  private buffer: WebGLBuffer;
  private target: number;
  private usage: number;
  private size = 0;

  constructor(gl: WebGLRenderingContext, options: BufferOptions = {}) {
    this.gl = gl;
    this.target = options.target ?? gl.ARRAY_BUFFER;
    this.usage = options.usage ?? gl.DYNAMIC_DRAW;
    
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create WebGL buffer');
    }
    
    this.buffer = buffer;
  }

  /***** BUFFER OPERATIONS *****/
  public bind(): void {
    this.gl.bindBuffer(this.target, this.buffer);
  }

  public unbind(): void {
    this.gl.bindBuffer(this.target, null);
  }

  public setData(data: ArrayBuffer | ArrayBufferView): void {
    this.bind();
    this.gl.bufferData(this.target, data, this.usage);
    this.size = data.byteLength;
  }

  public updateData(offset: number, data: ArrayBuffer | ArrayBufferView): void {
    this.bind();
    this.gl.bufferSubData(this.target, offset, data);
  }

  public allocate(size: number): void {
    this.bind();
    this.gl.bufferData(this.target, size, this.usage);
    this.size = size;
  }

  /***** PUBLIC API *****/
  public getBuffer(): WebGLBuffer {
    return this.buffer;
  }

  public getSize(): number {
    return this.size;
  }

  public getTarget(): number {
    return this.target;
  }

  public getUsage(): number {
    return this.usage;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
    }
  }
}

/***** VERTEX BUFFER CLASS *****/
export class VertexBuffer extends Buffer {
  constructor(gl: WebGLRenderingContext, usage = gl.DYNAMIC_DRAW) {
    super(gl, { target: gl.ARRAY_BUFFER, usage });
  }

  public setAttribute(location: number, size: number, type: number, normalized = false, stride = 0, offset = 0): void {
    this.bind();
    const gl = this.gl as WebGLRenderingContext;
    gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    gl.enableVertexAttribArray(location);
  }
}

/***** INDEX BUFFER CLASS *****/
export class IndexBuffer extends Buffer {
  private count = 0;

  constructor(gl: WebGLRenderingContext, usage = gl.STATIC_DRAW) {
    super(gl, { target: gl.ELEMENT_ARRAY_BUFFER, usage });
  }

  public setIndices(indices: Uint16Array | Uint32Array): void {
    this.setData(indices);
    this.count = indices.length;
  }

  public getCount(): number {
    return this.count;
  }
}
