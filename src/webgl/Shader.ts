/***** TYPE DEFINITIONS *****/
export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export interface UniformValue {
  type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D';
  value: number | Array<number> | Float32Array | Int32Array;
}

/***** SHADER CLASS *****/
export class Shader {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uniforms: Map<string, WebGLUniformLocation> = new Map();
  private attributes: Map<string, number> = new Map();

  constructor(gl: WebGLRenderingContext, source: ShaderSource) {
    this.gl = gl;
    this.program = this.createProgram(source);
    this.extractUniforms();
    this.extractAttributes();
  }

  /***** SHADER COMPILATION *****/
  private createProgram(source: ShaderSource): WebGLProgram {
    const vertexShader = this.compileShader(source.vertex, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(source.fragment, this.gl.FRAGMENT_SHADER);

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Failed to create shader program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Shader program linking failed: ${error}`);
    }

    // Clean up individual shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      const shaderType = type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      throw new Error(`${shaderType} shader compilation failed: ${error}`);
    }

    return shader;
  }

  /***** UNIFORM AND ATTRIBUTE EXTRACTION *****/
  private extractUniforms(): void {
    const uniformCount = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS);
    
    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = this.gl.getActiveUniform(this.program, i);
      if (!uniformInfo) continue;

      const location = this.gl.getUniformLocation(this.program, uniformInfo.name);
      if (location) {
        this.uniforms.set(uniformInfo.name, location);
      }
    }
  }

  private extractAttributes(): void {
    const attributeCount = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
    
    for (let i = 0; i < attributeCount; i++) {
      const attributeInfo = this.gl.getActiveAttrib(this.program, i);
      if (!attributeInfo) continue;

      const location = this.gl.getAttribLocation(this.program, attributeInfo.name);
      this.attributes.set(attributeInfo.name, location);
    }
  }

  /***** PUBLIC API *****/
  public use(): void {
    this.gl.useProgram(this.program);
  }

  public setUniform(name: string, value: UniformValue): void {
    const location = this.uniforms.get(name);
    if (!location) {
      console.warn(`Uniform ${name} not found in shader`);
      return;
    }

    switch (value.type) {
      case 'float':
        this.gl.uniform1f(location, value.value as number);
        break;
      case 'int':
      case 'sampler2D':
        this.gl.uniform1i(location, value.value as number);
        break;
      case 'vec2':
        const vec2 = value.value as Array<number>;
        this.gl.uniform2f(location, vec2[0], vec2[1]);
        break;
      case 'vec3':
        const vec3 = value.value as Array<number>;
        this.gl.uniform3f(location, vec3[0], vec3[1], vec3[2]);
        break;
      case 'vec4':
        const vec4 = value.value as Array<number>;
        this.gl.uniform4f(location, vec4[0], vec4[1], vec4[2], vec4[3]);
        break;
      case 'mat3':
        this.gl.uniformMatrix3fv(location, false, value.value as Float32Array);
        break;
      case 'mat4':
        this.gl.uniformMatrix4fv(location, false, value.value as Float32Array);
        break;
    }
  }

  public getAttributeLocation(name: string): number {
    const location = this.attributes.get(name);
    if (location === undefined) {
      return -1;
    }
    return location;
  }

  public enableAttribute(name: string): number {
    const location = this.getAttributeLocation(name);
    if (location >= 0) {
      this.gl.enableVertexAttribArray(location);
    }
    return location;
  }

  public disableAttribute(name: string): void {
    const location = this.getAttributeLocation(name);
    if (location >= 0) {
      this.gl.disableVertexAttribArray(location);
    }
  }

  public hasUniform(name: string): boolean {
    return this.uniforms.has(name);
  }

  public hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  public getProgram(): WebGLProgram {
    return this.program;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
