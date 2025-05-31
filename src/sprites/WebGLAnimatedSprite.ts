/***** TYPE DEFINITIONS *****/
import { SceneNode } from './SceneGraph';
import { SpriteAtlas } from './SpriteAtlas';

export interface AnimationFrame {
  frameId: string;
  duration: number;
}

export interface AnimationData {
  name: string;
  frames: Array<AnimationFrame>;
  loop: boolean;
  speed: number;
}

/***** WEBGL ANIMATED SPRITE CLASS *****/
export class WebGLAnimatedSprite extends SceneNode {
  private atlas: SpriteAtlas;
  private animations: Map<string, AnimationData> = new Map();
  private currentAnimation: string | null = null;
  private currentFrame = 0;
  private frameTime = 0;
  private _animationSpeed = 1.0;
  private isPlaying = false;
  private loop = true;

  // Sprite rendering properties
  public width: number = 0;
  public height: number = 0;
  public u1: number = 0;
  public v1: number = 0;
  public u2: number = 1;
  public v2: number = 1;

  constructor(atlas: SpriteAtlas, x = 0, y = 0) {
    super();
    this.atlas = atlas;
    this.setPosition(x, y);
  }

  /***** POSITION COMPATIBILITY *****/
  public get x(): number {
    return this.getPosition().x;
  }

  public set x(value: number) {
    this.setPosition(value, this.y);
  }

  public get y(): number {
    return this.getPosition().y;
  }

  public set y(value: number) {
    this.setPosition(this.x, value);
  }

  /***** ANIMATION SETUP *****/
  public addAnimation(name: string, frameIds: Array<string>, options: Partial<AnimationData> = {}): void {
    const frames: Array<AnimationFrame> = frameIds.map((frameId) => ({
      frameId,
      duration: 1 / 8, // Default 8 FPS, can be overridden
    }));

    const animationData: AnimationData = {
      name,
      frames,
      loop: options.loop ?? true,
      speed: options.speed ?? 1.0,
      ...options,
    };

    this.animations.set(name, animationData);
  }

  public addAnimationFromFrameNames(name: string, frameNames: Array<string>, fps = 8): void {
    const duration = 1 / fps;
    const frames: Array<AnimationFrame> = frameNames.map((frameId) => ({
      frameId,
      duration,
    }));

    this.animations.set(name, {
      name,
      frames,
      loop: true,
      speed: 1.0,
    });
  }

  /***** ANIMATION CONTROL *****/
  public play(animationName?: string): void {
    if (animationName) {
      this.setAnimation(animationName);
    }
    this.isPlaying = true;
  }

  public stop(): void {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.frameTime = 0;
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public resume(): void {
    this.isPlaying = true;
  }

  public setAnimation(name: string): boolean {
    if (!this.animations.has(name)) {
      console.warn(`Animation '${name}' not found`);
      return false;
    }

    if (this.currentAnimation === name) {
      return true;
    }

    this.currentAnimation = name;
    this.currentFrame = 0;
    this.frameTime = 0;

    // Update sprite frame immediately
    this.updateSpriteFrame();
    return true;
  }

  public setAnimationSpeed(speed: number): void {
    this._animationSpeed = speed;
  }

  public setLoop(loop: boolean): void {
    this.loop = loop;
  }

  /***** ANIMATION UPDATE *****/
  public update(deltaTime: number): void {
    if (!this.isPlaying || !this.currentAnimation) {
      return;
    }

    const animation = this.animations.get(this.currentAnimation);
    if (!animation || animation.frames.length === 0) {
      return;
    }

    // Update frame time
    this.frameTime += deltaTime * this._animationSpeed * animation.speed;

    const currentFrameData = animation.frames[this.currentFrame];
    if (this.frameTime >= currentFrameData.duration) {
      this.frameTime = 0;
      this.currentFrame++;

      // Check for animation end
      if (this.currentFrame >= animation.frames.length) {
        if (animation.loop && this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frames.length - 1;
          this.isPlaying = false;
        }
      }

      this.updateSpriteFrame();
    }
  }

  private updateSpriteFrame(): void {
    if (!this.currentAnimation) return;

    const animation = this.animations.get(this.currentAnimation);
    if (!animation || this.currentFrame >= animation.frames.length) return;

    const frameData = animation.frames[this.currentFrame];
    const atlasFrame = this.atlas.getFrame(frameData.frameId);
    
    if (atlasFrame) {
      // Update sprite display properties based on atlas frame
      this.width = atlasFrame.frame.width;
      this.height = atlasFrame.frame.height;
      
      // Store UV coordinates for rendering
      const coords = this.atlas.getTextureCoords(frameData.frameId);
      if (coords) {
        this.u1 = coords[0];
        this.v1 = coords[1];
        this.u2 = coords[4];
        this.v2 = coords[5];
      }
    }
  }

  /***** GETTERS *****/
  public getCurrentAnimation(): string | null {
    return this.currentAnimation;
  }

  public getCurrentFrame(): number {
    return this.currentFrame;
  }

  public isAnimationPlaying(): boolean {
    return this.isPlaying;
  }

  public getAnimationNames(): Array<string> {
    return Array.from(this.animations.keys());
  }

  public hasAnimation(name: string): boolean {
    return this.animations.has(name);
  }

  /***** STATIC HELPERS *****/
  /**
   * Create an animated sprite from frame name patterns
   * e.g., createFromPattern(atlas, 'walk_', 4) creates frames: walk_0, walk_1, walk_2, walk_3
   */
  public static createFromPattern(
    atlas: SpriteAtlas, 
    pattern: string, 
    frameCount: number, 
    startIndex = 0
  ): WebGLAnimatedSprite {
    const sprite = new WebGLAnimatedSprite(atlas);
    const frameNames: Array<string> = [];
    
    for (let i = startIndex; i < startIndex + frameCount; i++) {
      frameNames.push(`${pattern}${i}`);
    }
    
    sprite.addAnimationFromFrameNames('default', frameNames);
    return sprite;
  }

  /**
   * Create from array of frame names (compatible with PIXI.js style)
   */
  public static createFromFrames(atlas: SpriteAtlas, frameNames: Array<string>): WebGLAnimatedSprite {
    const sprite = new WebGLAnimatedSprite(atlas);
    sprite.addAnimationFromFrameNames('default', frameNames);
    return sprite;
  }

  /***** COMPATIBILITY METHODS *****/
  /**
   * PIXI.js compatibility: set textures array
   */
  public set textures(frameNames: Array<string>) {
    if (frameNames.length > 0) {
      this.addAnimationFromFrameNames('current', frameNames);
      this.setAnimation('current');
    }
  }

  public get textures(): Array<string> {
    if (!this.currentAnimation) return [];
    
    const animation = this.animations.get(this.currentAnimation);
    return animation ? animation.frames.map((f) => f.frameId) : [];
  }

  /**
   * PIXI.js compatibility: animation speed
   */
  public set animationSpeed(speed: number) {
    this.setAnimationSpeed(speed);
  }

  public get animationSpeed(): number {
    return this._animationSpeed;
  }
}
