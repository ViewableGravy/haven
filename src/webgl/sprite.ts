/***** TYPE DEFINITIONS *****/
export interface WebGLSpriteOptions {
  frames: Array<string>;
  animationSpeed?: number;
}

/***** WEBGL SPRITE CLASS *****/
export class WebGLSprite {
  private frames: Array<string>;
  private animationSpeed: number;
  private currentFrameIndex: number = 0;

  constructor(options: WebGLSpriteOptions) {
    this.frames = options.frames;
    this.animationSpeed = options.animationSpeed || 1.0;
  }

  /**
   * Set animation frames
   */
  public setFrames(frames: Array<string>): void {
    this.frames = frames;
    this.currentFrameIndex = 0;
  }

  /**
   * Set animation speed
   */
  public setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  /**
   * Play the animation
   */
  public play(): void {
    // Logic to start animation
  }

  /**
   * Stop the animation
   */
  public stop(): void {
    // Logic to stop animation
  }
}
