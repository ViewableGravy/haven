/***** TYPE DEFINITIONS *****/
import { WebGLAnimatedSprite } from '../../sprites/WebGLAnimatedSprite';
import { SpriteAtlas } from '../../sprites/SpriteAtlas';
import { CharacterSprite } from '../../spriteSheets/character';
import { RunningSprite } from '../../spriteSheets/running';
import type { Game } from '../game/game_webgl';

type MovementDirection = 'idle' | 'up' | 'down' | 'left' | 'right';

export interface RemotePlayerState {
  id: string;
  x: number;
  y: number;
  direction: MovementDirection;
  isMoving: boolean;
}

/***** WEBGL REMOTE PLAYER CLASS *****/
export class WebGLRemotePlayer {
  private game: Game;
  private id: string;
  private characterAtlas?: SpriteAtlas;
  private runningAtlas?: SpriteAtlas;
  private sprite?: WebGLAnimatedSprite;
  private currentDirection: MovementDirection = 'idle';
  
  // Position and movement
  private targetPosition = { x: 0, y: 0 };
  private currentPosition = { x: 0, y: 0 };
  private isMoving = false;
  private updateInterval?: number;
  
  // Update tracking
  private interpolationEnabled = true;

  constructor(game: Game, playerId: string, initialState: RemotePlayerState) {
    this.game = game;
    this.id = playerId;
    this.targetPosition = { x: initialState.x, y: initialState.y };
    this.currentPosition = { x: initialState.x, y: initialState.y };
    this.currentDirection = initialState.direction;
    this.isMoving = initialState.isMoving;
    
    this.initialize();
  }

  /***** INITIALIZATION *****/
  private async initialize(): Promise<void> {
    await this.loadSprites();
    this.initializeSprite();
    this.startUpdateLoop();
  }

  private async loadSprites(): Promise<void> {
    // Load character sprites
    await CharacterSprite.loadWithGL(this.game.state.renderer.getGL());
    this.characterAtlas = CharacterSprite.getAtlas();
    
    // Load running sprites  
    await RunningSprite.loadWithGL(this.game.state.renderer.getGL());
    this.runningAtlas = RunningSprite.getAtlas();
  }

  /***** SPRITE MANAGEMENT *****/
  private initializeSprite(): void {
    if (this.sprite || !this.characterAtlas) return;

    // Create animated sprite with character atlas
    this.sprite = new WebGLAnimatedSprite(this.characterAtlas, this.currentPosition.x, this.currentPosition.y);
    
    // Add idle animation
    const idleFrames = CharacterSprite.getAnimations()['idle'];
    if (idleFrames) {
      this.sprite.addAnimationFromFrameNames('idle', idleFrames);
      this.sprite.setAnimation('idle');
      this.sprite.play();
    }

    // Set sprite properties
    this.sprite.setPosition(this.currentPosition.x, this.currentPosition.y);
    
    // Set height to 2 tiles, maintain aspect ratio
    const targetHeight = this.game.consts.tileSize * 2;
    const originalWidth = this.sprite.width;
    const originalHeight = this.sprite.height;
    const aspectRatio = originalWidth / originalHeight;
    
    this.sprite.height = targetHeight;
    this.sprite.width = targetHeight * aspectRatio;

    this.updateAnimation();
  }

  /***** UPDATE LOOP *****/
  private startUpdateLoop(): void {
    // Update at ~60 FPS
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 16); // ~60 FPS
  }

  private update(): void {
    if (!this.sprite) return;

    const deltaTime = 0.016; // 16ms for 60 FPS

    // Update sprite animation
    this.sprite.update(deltaTime);

    // Interpolate position if enabled
    if (this.interpolationEnabled) {
      this.interpolatePosition(deltaTime);
    } else {
      this.currentPosition = { ...this.targetPosition };
    }

    // Update sprite position
    this.sprite.setPosition(this.currentPosition.x, this.currentPosition.y);
  }

  private interpolatePosition(deltaTime: number): void {
    const speed = 200; // pixels per second interpolation speed
    const dx = this.targetPosition.x - this.currentPosition.x;
    const dy = this.targetPosition.y - this.currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) { // Only interpolate if there's significant distance
      const moveDistance = speed * deltaTime;
      const ratio = Math.min(moveDistance / distance, 1);
      
      this.currentPosition.x += dx * ratio;
      this.currentPosition.y += dy * ratio;
    } else {
      this.currentPosition = { ...this.targetPosition };
    }
  }

  /***** ANIMATION MANAGEMENT *****/
  private updateAnimation(): void {
    if (!this.sprite) return;

    if (this.currentDirection === 'idle') {
      // Switch to idle animation with character atlas
      if (this.characterAtlas) {
        this.sprite = new WebGLAnimatedSprite(this.characterAtlas, this.currentPosition.x, this.currentPosition.y);
        const idleFrames = CharacterSprite.getAnimations()['idle'];
        if (idleFrames) {
          this.sprite.addAnimationFromFrameNames('idle', idleFrames);
          this.sprite.setAnimation('idle');
          this.sprite.play();
        }
        this.updateSpriteSize();
      }
    } else {
      // Switch to running animation with running atlas
      if (this.runningAtlas) {
        this.sprite = new WebGLAnimatedSprite(this.runningAtlas, this.currentPosition.x, this.currentPosition.y);
        const runningFrames = RunningSprite.getAnimations()[`running-${this.currentDirection}`];
        if (runningFrames) {
          this.sprite.addAnimationFromFrameNames(`running-${this.currentDirection}`, runningFrames);
          this.sprite.setAnimation(`running-${this.currentDirection}`);
          this.sprite.play();
        }
        this.updateSpriteSize();
      }
    }
  }

  private updateSpriteSize(): void {
    if (!this.sprite) return;
    
    // Set height to 2 tiles, maintain aspect ratio
    const targetHeight = this.game.consts.tileSize * 2;
    const originalWidth = this.sprite.width;
    const originalHeight = this.sprite.height;
    const aspectRatio = originalWidth / originalHeight;
    
    this.sprite.height = targetHeight;
    this.sprite.width = targetHeight * aspectRatio;
  }

  /***** PUBLIC API *****/
  public updateState(newState: RemotePlayerState): void {
    const positionChanged = this.targetPosition.x !== newState.x || this.targetPosition.y !== newState.y;
    const directionChanged = this.currentDirection !== newState.direction;

    this.targetPosition.x = newState.x;
    this.targetPosition.y = newState.y;
    this.isMoving = newState.isMoving;

    if (directionChanged) {
      this.currentDirection = newState.direction;
      this.updateAnimation();
    }

    // If position changed significantly, consider teleporting instead of interpolating
    if (positionChanged) {
      const distance = Math.sqrt(
        Math.pow(newState.x - this.currentPosition.x, 2) + 
        Math.pow(newState.y - this.currentPosition.y, 2)
      );
      
      if (distance > 200) { // Teleport threshold
        this.currentPosition.x = newState.x;
        this.currentPosition.y = newState.y;
      }
    }
  }

  public getSprite(): WebGLAnimatedSprite | undefined {
    return this.sprite;
  }

  public getId(): string {
    return this.id;
  }

  public getPosition(): { x: number; y: number } {
    return { ...this.currentPosition };
  }

  public getState(): RemotePlayerState {
    return {
      id: this.id,
      x: this.currentPosition.x,
      y: this.currentPosition.y,
      direction: this.currentDirection,
      isMoving: this.isMoving,
    };
  }

  public setInterpolationEnabled(enabled: boolean): void {
    this.interpolationEnabled = enabled;
  }

  /***** COMPATIBILITY METHODS *****/
  /**
   * PIXI.js compatibility method for existing code
   */
  public getCurrentSprite(): any {
    return this.sprite;
  }

  /**
   * Get sprite container for adding to scene
   */
  public getContainer(): WebGLAnimatedSprite | undefined {
    return this.sprite;
  }

  /***** CLEANUP *****/
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    if (this.characterAtlas) {
      this.characterAtlas.destroy();
    }
    if (this.runningAtlas) {
      this.runningAtlas.destroy();
    }

    this.sprite = undefined;
  }
}
