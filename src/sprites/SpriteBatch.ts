/***** TYPE DEFINITIONS *****/
import { Shader } from '../webgl/Shader';
import { VertexBuffer, IndexBuffer } from '../webgl/Buffer';
import { WebGLRenderer } from '../webgl/WebGLRenderer';
import { SpriteAtlas } from './SpriteAtlas';
import type { SpriteData } from './SceneGraph';

export interface BatchOptions {
  maxSprites?: number;
  maxTextures?: number;
}

/***** SPRITE BATCH RENDERER *****/
export class SpriteBatch {
  private gl: WebGLRenderingContext;
  private renderer: WebGLRenderer;
  private shader!: Shader;
  private vertexBuffer!: VertexBuffer;
  private indexBuffer!: IndexBuffer;
  private vertices!: Float32Array;
  private indices!: Uint16Array;
  private maxSprites: number;
  private maxTextures: number;
  private currentSpriteCount = 0;
  private currentTextures: Array<SpriteAtlas> = [];
  private textureMap: Map<SpriteAtlas, number> = new Map();

  // Vertex layout: position(2) + texCoord(2) + color(4) + textureIndex(1) = 9 floats per vertex
  private static readonly VERTEX_SIZE = 9;
  private static readonly VERTICES_PER_SPRITE = 4;
  private static readonly INDICES_PER_SPRITE = 6;

  constructor(renderer: WebGLRenderer, options: BatchOptions = {}) {
    this.renderer = renderer;
    this.gl = renderer.getGL();
    this.maxSprites = options.maxSprites ?? 1000;
    this.maxTextures = options.maxTextures ?? 8;

    this.createShader();
    this.createBuffers();
  }

  /***** INITIALIZATION *****/
  private createShader(): void {
    const vertexSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      attribute float a_textureIndex;

      uniform mat3 u_projection;
      uniform mat3 u_view;

      varying vec2 v_texCoord;
      varying vec4 v_color;
      varying float v_textureIndex;

      void main() {
        vec3 position = u_projection * u_view * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        
        v_texCoord = a_texCoord;
        v_color = a_color;
        v_textureIndex = a_textureIndex;
      }
    `;

    const fragmentSource = `
      precision mediump float;

      uniform sampler2D u_textures[8];
      uniform float u_alpha;

      varying vec2 v_texCoord;
      varying vec4 v_color;
      varying float v_textureIndex;

      void main() {
        vec4 texColor = vec4(1.0);
        
        int textureIndex = int(v_textureIndex + 0.5);
        
        if (textureIndex == 0) {
          texColor = texture2D(u_textures[0], v_texCoord);
        } else if (textureIndex == 1) {
          texColor = texture2D(u_textures[1], v_texCoord);
        } else if (textureIndex == 2) {
          texColor = texture2D(u_textures[2], v_texCoord);
        } else if (textureIndex == 3) {
          texColor = texture2D(u_textures[3], v_texCoord);
        } else if (textureIndex == 4) {
          texColor = texture2D(u_textures[4], v_texCoord);
        } else if (textureIndex == 5) {
          texColor = texture2D(u_textures[5], v_texCoord);
        } else if (textureIndex == 6) {
          texColor = texture2D(u_textures[6], v_texCoord);
        } else if (textureIndex == 7) {
          texColor = texture2D(u_textures[7], v_texCoord);
        }
        
        vec4 finalColor = texColor * v_color;
        finalColor.a *= u_alpha;
        
        gl_FragColor = finalColor;
      }
    `;

    this.shader = new Shader(this.gl, {
      vertex: vertexSource,
      fragment: fragmentSource,
    });
  }

  private createBuffers(): void {
    const vertexCount = this.maxSprites * SpriteBatch.VERTICES_PER_SPRITE * SpriteBatch.VERTEX_SIZE;
    const indexCount = this.maxSprites * SpriteBatch.INDICES_PER_SPRITE;

    this.vertices = new Float32Array(vertexCount);
    this.indices = new Uint16Array(indexCount);

    // Create index buffer data (same pattern for all sprites)
    for (let i = 0; i < this.maxSprites; i++) {
      const indexOffset = i * SpriteBatch.INDICES_PER_SPRITE;
      const vertexOffset = i * SpriteBatch.VERTICES_PER_SPRITE;

      // Two triangles per sprite (quad)
      this.indices[indexOffset + 0] = vertexOffset + 0; // bottom-left
      this.indices[indexOffset + 1] = vertexOffset + 1; // bottom-right
      this.indices[indexOffset + 2] = vertexOffset + 2; // top-right
      this.indices[indexOffset + 3] = vertexOffset + 0; // bottom-left
      this.indices[indexOffset + 4] = vertexOffset + 2; // top-right
      this.indices[indexOffset + 5] = vertexOffset + 3; // top-left
    }

    this.vertexBuffer = new VertexBuffer(this.gl);
    this.indexBuffer = new IndexBuffer(this.gl);
    this.indexBuffer.setIndices(this.indices);
  }

  /***** BATCHING *****/
  public begin(): void {
    this.currentSpriteCount = 0;
    this.currentTextures.length = 0;
    this.textureMap.clear();
  }

  public addSprites(atlas: SpriteAtlas, sprites: Array<SpriteData>): void {
    for (const sprite of sprites) {
      if (this.currentSpriteCount >= this.maxSprites) {
        this.flush();
        this.begin();
      }

      const textureIndex = this.getTextureIndex(atlas);
      if (textureIndex < 0) {
        // Too many textures, flush and start new batch
        this.flush();
        this.begin();
        const newTextureIndex = this.getTextureIndex(atlas);
        this.addSpriteToBuffer(sprite, newTextureIndex);
      } else {
        this.addSpriteToBuffer(sprite, textureIndex);
      }
    }
  }

  private getTextureIndex(atlas: SpriteAtlas): number {
    if (this.textureMap.has(atlas)) {
      return this.textureMap.get(atlas)!;
    }

    if (this.currentTextures.length >= this.maxTextures) {
      return -1; // Too many textures
    }

    const index = this.currentTextures.length;
    this.currentTextures.push(atlas);
    this.textureMap.set(atlas, index);
    return index;
  }

  private addSpriteToBuffer(sprite: SpriteData, textureIndex: number): void {
    const vertexOffset = this.currentSpriteCount * SpriteBatch.VERTICES_PER_SPRITE * SpriteBatch.VERTEX_SIZE;

    // Calculate sprite corners
    const x1 = sprite.x;
    const y1 = sprite.y;
    const x2 = sprite.x + sprite.width;
    const y2 = sprite.y + sprite.height;

    // UV coordinates
    const u1 = sprite.u1;
    const v1 = sprite.v1;
    const u2 = sprite.u2;
    const v2 = sprite.v2;

    // Color
    const r = sprite.r;
    const g = sprite.g;
    const b = sprite.b;
    const a = sprite.a;

    // Bottom-left vertex
    this.vertices[vertexOffset + 0] = x1; // x
    this.vertices[vertexOffset + 1] = y2; // y
    this.vertices[vertexOffset + 2] = u1; // u
    this.vertices[vertexOffset + 3] = v2; // v
    this.vertices[vertexOffset + 4] = r;  // r
    this.vertices[vertexOffset + 5] = g;  // g
    this.vertices[vertexOffset + 6] = b;  // b
    this.vertices[vertexOffset + 7] = a;  // a
    this.vertices[vertexOffset + 8] = textureIndex; // texture index

    // Bottom-right vertex
    this.vertices[vertexOffset + 9] = x2;  // x
    this.vertices[vertexOffset + 10] = y2; // y
    this.vertices[vertexOffset + 11] = u2; // u
    this.vertices[vertexOffset + 12] = v2; // v
    this.vertices[vertexOffset + 13] = r;  // r
    this.vertices[vertexOffset + 14] = g;  // g
    this.vertices[vertexOffset + 15] = b;  // b
    this.vertices[vertexOffset + 16] = a;  // a
    this.vertices[vertexOffset + 17] = textureIndex; // texture index

    // Top-right vertex
    this.vertices[vertexOffset + 18] = x2; // x
    this.vertices[vertexOffset + 19] = y1; // y
    this.vertices[vertexOffset + 20] = u2; // u
    this.vertices[vertexOffset + 21] = v1; // v
    this.vertices[vertexOffset + 22] = r;  // r
    this.vertices[vertexOffset + 23] = g;  // g
    this.vertices[vertexOffset + 24] = b;  // b
    this.vertices[vertexOffset + 25] = a;  // a
    this.vertices[vertexOffset + 26] = textureIndex; // texture index

    // Top-left vertex
    this.vertices[vertexOffset + 27] = x1; // x
    this.vertices[vertexOffset + 28] = y1; // y
    this.vertices[vertexOffset + 29] = u1; // u
    this.vertices[vertexOffset + 30] = v1; // v
    this.vertices[vertexOffset + 31] = r;  // r
    this.vertices[vertexOffset + 32] = g;  // g
    this.vertices[vertexOffset + 33] = b;  // b
    this.vertices[vertexOffset + 34] = a;  // a
    this.vertices[vertexOffset + 35] = textureIndex; // texture index

    this.currentSpriteCount++;
  }

  public flush(): void {
    if (this.currentSpriteCount === 0) return;

    // Upload vertex data
    this.vertexBuffer.setData(this.vertices.subarray(0, this.currentSpriteCount * SpriteBatch.VERTICES_PER_SPRITE * SpriteBatch.VERTEX_SIZE));

    // Use shader
    this.shader.use();

    // Set uniforms
    this.shader.setUniform('u_projection', { type: 'mat3', value: this.renderer.getProjectionMatrix() });
    this.shader.setUniform('u_view', { type: 'mat3', value: this.renderer.getViewMatrix() });
    this.shader.setUniform('u_alpha', { type: 'float', value: 1.0 });

    // Bind textures
    for (let i = 0; i < this.currentTextures.length; i++) {
      this.currentTextures[i].bind(i);
      this.shader.setUniform(`u_textures[${i}]`, { type: 'sampler2D', value: i });
    }

    // Setup vertex attributes
    this.vertexBuffer.bind();
    this.indexBuffer.bind();

    const stride = SpriteBatch.VERTEX_SIZE * 4; // 4 bytes per float
    const positionLocation = this.shader.enableAttribute('a_position');
    const texCoordLocation = this.shader.enableAttribute('a_texCoord');
    const colorLocation = this.shader.enableAttribute('a_color');
    const textureIndexLocation = this.shader.enableAttribute('a_textureIndex');

    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, stride, 0);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, stride, 8);
    this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, stride, 16);
    this.gl.vertexAttribPointer(textureIndexLocation, 1, this.gl.FLOAT, false, stride, 32);

    // Draw
    const indexCount = this.currentSpriteCount * SpriteBatch.INDICES_PER_SPRITE;
    this.gl.drawElements(this.gl.TRIANGLES, indexCount, this.gl.UNSIGNED_SHORT, 0);

    // Update stats
    this.renderer.addDrawCall(this.currentSpriteCount * 2, this.currentSpriteCount * 4);

    // Disable attributes
    this.shader.disableAttribute('a_position');
    this.shader.disableAttribute('a_texCoord');
    this.shader.disableAttribute('a_color');
    this.shader.disableAttribute('a_textureIndex');
  }

  public end(): void {
    this.flush();
  }

  /***** PUBLIC API *****/
  public getMaxSprites(): number {
    return this.maxSprites;
  }

  public getCurrentSpriteCount(): number {
    return this.currentSpriteCount;
  }

  public getMaxTextures(): number {
    return this.maxTextures;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    this.shader.destroy();
    this.vertexBuffer.destroy();
    this.indexBuffer.destroy();
  }
}
