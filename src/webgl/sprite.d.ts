export interface WebGLSpriteOptions {
  frames: Array<string>;
  animationSpeed?: number;
}

export class WebGLSprite {
  constructor(options: WebGLSpriteOptions);
  public setFrames(frames: Array<string>): void;
  public setAnimationSpeed(speed: number): void;
  public play(): void;
  public stop(): void;
}
