/***** TYPE DEFINITIONS *****/
import { WebGLAnimatedSprite } from '../../sprites/WebGLAnimatedSprite';
import { SpriteAtlas } from '../../sprites/SpriteAtlas';
import { CharacterSprite } from '../../spriteSheets/character';
import { RunningSprite } from '../../spriteSheets/running';
import type { WebGLRenderer } from '../../webgl/WebGLRenderer';

export type MovementDirection = 'idle' | 'up' | 'down' | 'left' | 'right';

export interface PlayerPosition {
  x: number;
  y: number;
}

export interface PlayerState {
  position: PlayerPosition;
  direction: MovementDirection;
  isMoving: boolean;
}

/***** WEBGL PLAYER CLASS *****/
export class WebGLPlayer {
  private renderer: WebGLRenderer;
  private characterAtlas?: SpriteAtlas;
  private runningAtlas?: SpriteAtlas;
  private currentSprite?: WebGLAnimatedSprite;
  private currentDirection: MovementDirection = 'idle';
  
  // Movement and state
  private position: PlayerPosition = { x: 0, y: 0 };
  private isMoving = false;
  private speed = 100; // pixels per second
  
  // Input state
  private keys: Set<string> = new Set();

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    this.setupEventListeners();
  }

  /***** INITIALIZATION *****/
  public async initialize(): Promise<void> {
    await this.loadSprites();
    this.initializeSprite();
  }

  private async loadSprites(): Promise<void> {
    // Load character sprites
    await CharacterSprite.loadWithGL(this.renderer.getGL());
    this.characterAtlas = CharacterSprite.getAtlas();
    
    // Load running sprites  
    await RunningSprite.loadWithGL(this.renderer.getGL());
    this.runningAtlas = RunningSprite.getAtlas();
  }

  /***** SPRITE MANAGEMENT *****/
  public initializeSprite(): WebGLAnimatedSprite | undefined {
    if (this.currentSprite || !this.characterAtlas) {
      return this.currentSprite;
    }

    // Create animated sprite with character atlas
    this.currentSprite = new WebGLAnimatedSprite(this.characterAtlas, this.position.x, this.position.y);
    
    // Add idle animation
    const idleFrames = CharacterSprite.getAnimations()['idle'];
    if (idleFrames) {
      this.currentSprite.addAnimationFromFrameNames('idle', idleFrames);
      this.currentSprite.setAnimation('idle');
      this.currentSprite.play();
    }

    // Add running animations from running atlas if available
    if (this.runningAtlas) {
      // Running animations will be handled during animation switching
      // since they use a different atlas
    }

    this.currentDirection = 'idle';
    return this.currentSprite;
  }

  /***** MOVEMENT AND CONTROLS *****/
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  public update(deltaTime: number): void {
    this.handleInput(deltaTime);
    this.updateAnimation();
    
    if (this.currentSprite) {
      this.currentSprite.update(deltaTime);
      this.currentSprite.x = this.position.x;
      this.currentSprite.y = this.position.y;
    }
  }

  private handleInput(deltaTime: number): void {
    let newDirection: MovementDirection = 'idle';
    let dx = 0;
    let dy = 0;

    // Handle directional input
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      dy -= 1;
      newDirection = 'up';
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      dy += 1;
      newDirection = 'down';
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      dx -= 1;
      newDirection = 'left';
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      dx += 1;
      newDirection = 'right';
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; // Math.sqrt(2) / 2
      dy *= 0.707;
    }

    // Update position
    if (dx !== 0 || dy !== 0) {
      this.position.x += dx * this.speed * deltaTime;
      this.position.y += dy * this.speed * deltaTime;
      this.isMoving = true;
      
      // Update direction based on primary movement
      if (Math.abs(dx) > Math.abs(dy)) {
        newDirection = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        newDirection = dy > 0 ? 'down' : 'up';
      }
    } else {
      this.isMoving = false;
      newDirection = 'idle';
    }

    // Update animation if direction changed
    if (newDirection !== this.currentDirection) {
      this.updateAnimation(newDirection);
    }
  }

  private updateAnimation(direction?: MovementDirection): void {
    if (!this.currentSprite) return;

    const newDirection = direction ?? this.currentDirection;
    
    if (this.currentDirection === newDirection) {
      return;
    }

    this.currentDirection = newDirection;

    if (newDirection === 'idle') {
      // Switch to idle animation with character atlas
      if (this.characterAtlas) {
        this.currentSprite = new WebGLAnimatedSprite(this.characterAtlas, this.position.x, this.position.y);
        const idleFrames = CharacterSprite.getAnimations()['idle'];
        if (idleFrames) {
          this.currentSprite.addAnimationFromFrameNames('idle', idleFrames);
          this.currentSprite.setAnimation('idle');
          this.currentSprite.play();
        }
      }
    } else {
      // Switch to running animation with running atlas
      if (this.runningAtlas) {
        this.currentSprite = new WebGLAnimatedSprite(this.runningAtlas, this.position.x, this.position.y);
        const runningFrames = RunningSprite.getAnimations()[`running-${newDirection}`];
        if (runningFrames) {
          this.currentSprite.addAnimationFromFrameNames(`running-${newDirection}`, runningFrames);
          this.currentSprite.setAnimation(`running-${newDirection}`);
          this.currentSprite.play();
        }
      }
    }
  }

  /***** PUBLIC API *****/
  public getPosition(): PlayerPosition {
    return { ...this.position };
  }

  public setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    
    if (this.currentSprite) {
      this.currentSprite.x = x;
      this.currentSprite.y = y;
    }
  }

  public getSprite(): WebGLAnimatedSprite | undefined {
    return this.currentSprite;
  }

  public getState(): PlayerState {
    return {
      position: this.getPosition(),
      direction: this.currentDirection,
      isMoving: this.isMoving,
    };
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public getSpeed(): number {
    return this.speed;
  }

  /***** COMPATIBILITY METHODS *****/
  /**
   * PIXI.js compatibility method for existing code
   */
  public getCurrentSprite(): any {
    return this.currentSprite;
  }

  /**
   * Get current sprite position for camera following
   */
  public getSpritePosition(): { x: number; y: number } {
    return this.getPosition();
  }

  /***** CLEANUP *****/
  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    if (this.characterAtlas) {
      this.characterAtlas.destroy();
    }
    if (this.runningAtlas) {
      this.runningAtlas.destroy();
    }
    
    this.keys.clear();
  }
}
