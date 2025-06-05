/***** TYPE DEFINITIONS *****/
import { AnimatedSprite } from "pixi.js";
import { CharacterSprite } from "../../spriteSheets/character";
import { RunningSprite } from "../../spriteSheets/running";
import type { Game } from "../game/game";
import { SubscribablePosition } from "../position/subscribable";

type MovementDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'idle';

interface PositionSnapshot {
  x: number;
  y: number;
  timestamp: number;
}

/***** REMOTE PLAYER CLASS *****/
export class RemotePlayer {
  public id: string;
  public position: SubscribablePosition;
  private sprite: AnimatedSprite | null = null;
  private game: Game;
  private currentDirection: MovementDirection = 'idle';
  
  // Smoothing and prediction properties
  private currentSnapshot: PositionSnapshot;
  private targetSnapshot: PositionSnapshot;
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private interpolationSpeed: number = 0.15;
  private predictionTime: number = 100; // ms to predict ahead
  
  // Cleanup tracking
  private positionUnsubscribe: (() => void) | null = null;
  private animationFrameId: number | null = null;

  constructor(id: string, x: number, y: number, game: Game) {
    this.id = id;
    this.game = game;
    this.position = new SubscribablePosition(x, y, "global");
    
    const now = Date.now();
    this.currentSnapshot = { x, y, timestamp: now };
    this.targetSnapshot = { x, y, timestamp: now };
    
    this.initializeSprite();
    this.startUpdateLoop();
  }

  /***** SPRITE MANAGEMENT *****/
  private initializeSprite(): void {
    if (this.sprite) return;

    const idleFrames = CharacterSprite.getSpriteSheet().animations['idle'];
    this.sprite = new AnimatedSprite(idleFrames);
    this.sprite.animationSpeed = 1.0;
    this.sprite.play();

    // Center the sprite's anchor point
    this.sprite.anchor.set(0.5);
    
    // Set height to 2 tiles, maintain original aspect ratio
    const targetHeight = this.game.consts.tileSize * 2;
    const originalAspectRatio = this.sprite.texture.width / this.sprite.texture.height;
    
    this.sprite.height = targetHeight;
    this.sprite.width = targetHeight * originalAspectRatio;
    
    // Set high z-index to render on top of everything (but below local player)
    this.sprite.zIndex = 999;
    
    // Apply a slight tint to distinguish from local player
    this.sprite.tint = 0xccccff;

    // Subscribe to position changes to update sprite position
    this.positionUnsubscribe = this.position.subscribeImmediately(({ x, y }) => {
      if (this.sprite) {
        this.sprite.x = x;
        this.sprite.y = y;
      }
    });

    // Add to world container
    this.game.world.addChild(this.sprite);
    
    // Ensure world container sorts children by z-index
    this.game.world.sortableChildren = true;
  }

  /***** POSITION UPDATES *****/
  public updatePosition(x: number, y: number): void {
    const now = Date.now();
    
    // Calculate velocity based on previous target
    const deltaTime = now - this.targetSnapshot.timestamp;
    if (deltaTime > 0) {
      this.velocity.x = (x - this.targetSnapshot.x) / deltaTime;
      this.velocity.y = (y - this.targetSnapshot.y) / deltaTime;
    }
    
    // Update target snapshot
    this.targetSnapshot = { x, y, timestamp: now };
    
    // Update animation based on velocity
    const direction = this.calculateMovementDirectionFromVelocity();
    this.updateAnimation(direction);
  }

  /***** SMOOTH INTERPOLATION *****/
  private startUpdateLoop(): void {
    const update = () => {
      this.interpolatePosition();
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private interpolatePosition(): void {
    const now = Date.now();
    
    // Calculate predicted target position
    const timeSinceUpdate = now - this.targetSnapshot.timestamp;
    const predictedX = this.targetSnapshot.x + (this.velocity.x * Math.min(timeSinceUpdate, this.predictionTime));
    const predictedY = this.targetSnapshot.y + (this.velocity.y * Math.min(timeSinceUpdate, this.predictionTime));
    
    // Interpolate current position towards predicted position
    const deltaX = predictedX - this.currentSnapshot.x;
    const deltaY = predictedY - this.currentSnapshot.y;
    
    this.currentSnapshot.x += deltaX * this.interpolationSpeed;
    this.currentSnapshot.y += deltaY * this.interpolationSpeed;
    this.currentSnapshot.timestamp = now;
    
    // Update position
    this.position.position = { 
      x: this.currentSnapshot.x, 
      y: this.currentSnapshot.y 
    };
  }

  /***** ANIMATION MANAGEMENT *****/
  private calculateMovementDirectionFromVelocity(): MovementDirection {
    const threshold = 0.001; // Minimum velocity to trigger animation
    
    if (Math.abs(this.velocity.x) < threshold && Math.abs(this.velocity.y) < threshold) {
      return 'idle';
    }

    // Determine primary direction based on velocity
    if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
      // Horizontal movement dominates
      if (this.velocity.x > 0) {
        return this.velocity.y > 0 ? 'southeast' : this.velocity.y < 0 ? 'northeast' : 'east';
      } else {
        return this.velocity.y > 0 ? 'southwest' : this.velocity.y < 0 ? 'northwest' : 'west';
      }
    } else {
      // Vertical movement dominates
      if (this.velocity.y > 0) {
        return this.velocity.x > 0 ? 'southeast' : this.velocity.x < 0 ? 'southwest' : 'south';
      } else {
        return this.velocity.x > 0 ? 'northeast' : this.velocity.x < 0 ? 'northwest' : 'north';
      }
    }
  }

  private updateAnimation(direction: MovementDirection): void {
    if (!this.sprite || this.currentDirection === direction) {
      return;
    }

    this.currentDirection = direction;

    if (direction === 'idle') {
      // Switch to idle animation
      const idleFrames = CharacterSprite.getSpriteSheet().animations['idle'];
      this.sprite.textures = idleFrames;
    } else {
      // Switch to running animation for the specific direction
      const runningFrames = RunningSprite.getSpriteSheet().animations[`running-${direction}`];
      if (runningFrames) {
        this.sprite.textures = runningFrames;
      }
    }

    this.sprite.play();
  }

  /***** CLEANUP *****/
  public destroy(): void {
    // Cancel animation frame loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Unsubscribe from position changes
    if (this.positionUnsubscribe) {
      this.positionUnsubscribe();
      this.positionUnsubscribe = null;
    }
    
    // Clean up sprite
    if (this.sprite) {
      this.game.world.removeChild(this.sprite);
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /***** GETTERS *****/
  public getSprite(): AnimatedSprite | null {
    return this.sprite;
  }
}