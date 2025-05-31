/***** TYPE DEFINITIONS *****/
export interface Transform2D {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  originX: number;
  originY: number;
}

/***** TRANSFORM CLASS *****/
export class Transform {
  public x = 0;
  public y = 0;
  public scaleX = 1;
  public scaleY = 1;
  public rotation = 0;
  public originX = 0;
  public originY = 0;
  
  private matrix = new Float32Array(9);
  private worldMatrix = new Float32Array(9);
  private isDirty = true;
  private parent?: Transform;

  constructor(transform?: Partial<Transform2D>) {
    if (transform) {
      Object.assign(this, transform);
    }
    this.updateMatrix();
  }

  /***** MATRIX OPERATIONS *****/
  private updateMatrix(): void {
    if (!this.isDirty) return;

    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    
    // Create transformation matrix
    // Translation to origin
    const tx1 = -this.originX * this.scaleX;
    const ty1 = -this.originY * this.scaleY;
    
    // Scale and rotation
    const a = cos * this.scaleX;
    const b = sin * this.scaleX;
    const c = -sin * this.scaleY;
    const d = cos * this.scaleY;
    
    // Final translation
    const tx = a * tx1 + c * ty1 + this.x;
    const ty = b * tx1 + d * ty1 + this.y;
    
    // Set matrix values (column-major order for WebGL)
    this.matrix[0] = a;   this.matrix[3] = c;   this.matrix[6] = tx;
    this.matrix[1] = b;   this.matrix[4] = d;   this.matrix[7] = ty;
    this.matrix[2] = 0;   this.matrix[5] = 0;   this.matrix[8] = 1;
    
    this.isDirty = false;
  }

  public getMatrix(): Float32Array {
    this.updateMatrix();
    return this.matrix;
  }

  public getWorldMatrix(): Float32Array {
    this.updateMatrix();
    
    if (this.parent) {
      const parentMatrix = this.parent.getWorldMatrix();
      Transform.multiplyMatrices(parentMatrix, this.matrix, this.worldMatrix);
      return this.worldMatrix;
    }
    
    return this.matrix;
  }

  /***** STATIC MATRIX UTILITIES *****/
  public static createIdentity(): Float32Array {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }

  public static createTranslation(x: number, y: number): Float32Array {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      x, y, 1
    ]);
  }

  public static createScale(x: number, y: number): Float32Array {
    return new Float32Array([
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    ]);
  }

  public static createRotation(angle: number): Float32Array {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    return new Float32Array([
      cos, sin, 0,
      -sin, cos, 0,
      0, 0, 1
    ]);
  }

  public static createProjection(width: number, height: number): Float32Array {
    // Orthographic projection for 2D rendering
    return new Float32Array([
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ]);
  }

  public static multiplyMatrices(a: Float32Array, b: Float32Array, result: Float32Array): void {
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];

    const b00 = b[0], b01 = b[3], b02 = b[6];
    const b10 = b[1], b11 = b[4], b12 = b[7];
    const b20 = b[2], b21 = b[5], b22 = b[8];

    result[0] = a00 * b00 + a01 * b10 + a02 * b20;
    result[1] = a10 * b00 + a11 * b10 + a12 * b20;
    result[2] = a20 * b00 + a21 * b10 + a22 * b20;

    result[3] = a00 * b01 + a01 * b11 + a02 * b21;
    result[4] = a10 * b01 + a11 * b11 + a12 * b21;
    result[5] = a20 * b01 + a21 * b11 + a22 * b21;

    result[6] = a00 * b02 + a01 * b12 + a02 * b22;
    result[7] = a10 * b02 + a11 * b12 + a12 * b22;
    result[8] = a20 * b02 + a21 * b12 + a22 * b22;
  }

  /***** TRANSFORM OPERATIONS *****/
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.markDirty();
  }

  public setScale(x: number, y?: number): void {
    this.scaleX = x;
    this.scaleY = y ?? x;
    this.markDirty();
  }

  public setRotation(angle: number): void {
    this.rotation = angle;
    this.markDirty();
  }

  public setOrigin(x: number, y: number): void {
    this.originX = x;
    this.originY = y;
    this.markDirty();
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getScale(): { x: number; y: number } {
    return { x: this.scaleX, y: this.scaleY };
  }

  public getRotation(): number {
    return this.rotation;
  }

  public getOrigin(): { x: number; y: number } {
    return { x: this.originX, y: this.originY };
  }

  public translate(x: number, y: number): void {
    this.x += x;
    this.y += y;
    this.markDirty();
  }

  public scale(x: number, y?: number): void {
    this.scaleX *= x;
    this.scaleY *= (y ?? x);
    this.markDirty();
  }

  public rotate(angle: number): void {
    this.rotation += angle;
    this.markDirty();
  }

  /***** PARENT-CHILD RELATIONSHIPS *****/
  public setParent(parent?: Transform): void {
    this.parent = parent;
    this.markDirty();
  }

  public getParent(): Transform | undefined {
    return this.parent;
  }

  /***** UTILITIES *****/
  private markDirty(): void {
    this.isDirty = true;
  }

  public clone(): Transform {
    const clone = new Transform({
      x: this.x,
      y: this.y,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      rotation: this.rotation,
      originX: this.originX,
      originY: this.originY,
    });
    return clone;
  }

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.originX = 0;
    this.originY = 0;
    this.markDirty();
  }
}
