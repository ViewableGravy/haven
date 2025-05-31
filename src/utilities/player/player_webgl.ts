import type { SetOptional } from "type-fest";
import { CharacterSprite } from "../../spriteSheets/character";
import { RunningSprite } from "../../spriteSheets/running";
import { SceneNode } from "../../sprites/SceneGraph";
import type { Game } from "../game/game_webgl";
import type { KeyboardController } from "../keyboardController";
import type { MultiplayerClient } from "../multiplayer/client";
import type { Position } from "../position";
import { SubscribablePosition } from "../position/subscribable";

/***** TYPE DEFINITIONS *****/
type MovementDirection = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'idle';

type PlayerOptions = {
  position: SetOptional<Position, "type">;
  controller: KeyboardController;
}

type TickerLike = {
  deltaTime: number;
  elapsedMS: number;
  lastTime: number;
  speed: number;
  started: boolean;
}

/***** PLAYER CLASS *****/
export class Player {
  private controller: KeyboardController;
  public position: SubscribablePosition;
  private currentSprite: SceneNode | null = null;
  private currentDirection: MovementDirection = 'idle';
  private currentAnimationName: string = 'idle';
  private animationFrameIndex: number = 0;
  private animationSpeed: number = 8.0; // frames per second
  private lastAnimationUpdate: number = 0;
  
  // Multiplayer position update tracking
  private multiplayerClient: MultiplayerClient | null = null;
  private lastPositionUpdate: number = 0;
  private positionUpdateThrottle: number = 50; // ms
  private wasMovingLastTick: boolean = false;
  private idleUpdateTimeout: NodeJS.Timeout | null = null;

  constructor(opts: PlayerOptions) {
    this.controller = opts.controller;
    this.position = new SubscribablePosition(
      opts.position.x, 
      opts.position.y,
      opts.position.type
    );
  }

  /***** SPRITE MANAGEMENT *****/
  /**
   * Initialize the player sprite with idle animation
   */
  public initializeSprite = (): SceneNode => {
    if (this.currentSprite) {
      return this.currentSprite;
    }

    // Create a scene node for the player sprite
    this.currentSprite = new SceneNode();
    
    // Get initial texture from idle animation
    const atlas = CharacterSprite.getAtlas();
    const idleFrames = CharacterSprite.animations.idle;
    if (idleFrames && idleFrames.length > 0) {
      this.currentSprite.setTexture(atlas, idleFrames[0], 92, 116);
    }
    
    this.currentDirection = 'idle';
    this.currentAnimationName = 'idle';
    this.animationFrameIndex = 0;
    this.lastAnimationUpdate = performance.now();

    return this.currentSprite;
  }

  /**
   * Get the current sprite for rendering
   */
  public getSprite = (): SceneNode | null => {
    return this.currentSprite;
  }

  /***** ANIMATION SYSTEM *****/
  /**
   * Update animation frame based on time
   */
  private updateAnimationFrame = (currentTime: number): void => {
    if (!this.currentSprite) return;

    const frameTime = 1000 / this.animationSpeed; // ms per frame
    if (currentTime - this.lastAnimationUpdate >= frameTime) {
      let atlas, frames;
      
      if (this.currentAnimationName === 'idle') {
        atlas = CharacterSprite.getAtlas();
        frames = CharacterSprite.animations.idle;
      } else {
        atlas = RunningSprite.getAtlas();
        frames = RunningSprite.animations[this.currentAnimationName];
      }
      
      if (frames && frames.length > 0) {
        this.animationFrameIndex = (this.animationFrameIndex + 1) % frames.length;
        this.currentSprite.setTexture(atlas, frames[this.animationFrameIndex], 
          this.currentAnimationName === 'idle' ? 92 : 88, 
          this.currentAnimationName === 'idle' ? 116 : 132);
      }
      
      this.lastAnimationUpdate = currentTime;
    }
  }

  /***** MOVEMENT AND ANIMATION *****/
  /**
   * Check if any movement keys are currently pressed
   */
  public isMoving = (): boolean => {
    const { up, down, left, right } = this.controller.keys;
    return up.pressed || down.pressed || left.pressed || right.pressed;
  }

  /**
   * Determine movement direction based on keyboard input
   */
  private getMovementDirection = (): MovementDirection => {
    const { up, down, left, right } = this.controller.keys;

    // Check for diagonal movements first
    if (up.pressed && right.pressed) return 'northeast';
    if (down.pressed && right.pressed) return 'southeast';
    if (down.pressed && left.pressed) return 'southwest';
    if (up.pressed && left.pressed) return 'northwest';

    // Check for cardinal directions
    if (up.pressed) return 'north';
    if (down.pressed) return 'south';
    if (left.pressed) return 'west';
    if (right.pressed) return 'east';

    return 'idle';
  }

  /**
   * Update sprite animation based on movement direction
   */
  private updateAnimation = (direction: MovementDirection) => {
    if (!this.currentSprite || this.currentDirection === direction) {
      return;
    }

    this.currentDirection = direction;

    if (direction === 'idle') {
      // Switch to idle animation
      this.currentAnimationName = 'idle';
      const atlas = CharacterSprite.getAtlas();
      const idleFrames = CharacterSprite.animations.idle;
      if (idleFrames && idleFrames.length > 0) {
        this.animationFrameIndex = 0;
        this.currentSprite.setTexture(atlas, idleFrames[0], 92, 116);
      }
    } else {
      // Switch to running animation for the specific direction
      this.currentAnimationName = `running-${direction}`;
      const atlas = RunningSprite.getAtlas();
      const runningFrames = RunningSprite.animations[`running-${direction}`];
      if (runningFrames && runningFrames.length > 0) {
        this.animationFrameIndex = 0;
        this.currentSprite.setTexture(atlas, runningFrames[0], 88, 132);
      }
    }
  }

  /***** MULTIPLAYER INTEGRATION *****/
  /**
   * Set the multiplayer client for position updates
   */
  public setMultiplayerClient = (client: MultiplayerClient | null): void => {
    this.multiplayerClient = client;
  }

  /**
   * Send position update to multiplayer server if client is connected
   */
  private sendPositionUpdate = (): void => {
    if (!this.multiplayerClient) return;
    
    const now = Date.now();
    if (now - this.lastPositionUpdate >= this.positionUpdateThrottle) {
      const { x, y } = this.position.position;
      if (x && y) {
        this.multiplayerClient.sendPositionUpdate(x, y);
        this.lastPositionUpdate = now;
      }
    }
  }

  /***** MAIN UPDATE LOOP *****/
  public handleMovement = (game: Game, ticker: TickerLike) => {
    const baseSpeed = 10 * ticker.deltaTime / game.state.zoom;
    const direction = this.getMovementDirection();
    const isCurrentlyMoving = this.isMoving();

    // Update animation frame
    this.updateAnimationFrame(performance.now());

    // Update animation based on movement direction
    this.updateAnimation(direction);

    // Handle multiplayer position updates
    if (isCurrentlyMoving) {
      // Clear any pending idle update when moving
      if (this.idleUpdateTimeout) {
        clearTimeout(this.idleUpdateTimeout);
        this.idleUpdateTimeout = null;
      }
      // Send position updates while moving
      this.sendPositionUpdate();
    } else if (this.wasMovingLastTick && !isCurrentlyMoving) {
      // Just stopped moving - send immediate final position update
      if (this.multiplayerClient) {
        const { x, y } = this.position.position;
        if (x !== undefined && y !== undefined) {
          this.multiplayerClient.sendPositionUpdate(x, y);
          this.lastPositionUpdate = Date.now();
        }
      }
      
      // Schedule one additional position update after 100ms to ensure sync
      this.idleUpdateTimeout = setTimeout(() => {
        if (this.multiplayerClient && !this.isMoving()) {
          const { x, y } = this.position.position;
          if (x !== undefined && y !== undefined) {
            this.multiplayerClient.sendPositionUpdate(x, y);
            this.lastPositionUpdate = Date.now();
          }
        }
        this.idleUpdateTimeout = null;
      }, 100);
    }
    
    // Track movement state for next tick
    this.wasMovingLastTick = isCurrentlyMoving;

    // Calculate movement deltas
    let deltaX = 0;
    let deltaY = 0;

    if (this.controller.keys.right.pressed) {
      deltaX += 1;
    }
    if (this.controller.keys.left.pressed) {
      deltaX -= 1;
    }
    if (this.controller.keys.up.pressed) {
      deltaY -= 1;
    }
    if (this.controller.keys.down.pressed) {
      deltaY += 1;
    }

    // Normalize diagonal movement to prevent faster speed
    if (deltaX !== 0 && deltaY !== 0) {
      // Apply diagonal normalization factor (1/√2 ≈ 0.707)
      const diagonalFactor = Math.sqrt(2) / 2;
      deltaX *= diagonalFactor;
      deltaY *= diagonalFactor;
    }

    // Apply movement
    this.position.x += deltaX * baseSpeed;
    this.position.y += deltaY * baseSpeed;
  }

  /***** CLEANUP *****/
  public destroy = (): void => {
    if (this.idleUpdateTimeout) {
      clearTimeout(this.idleUpdateTimeout);
      this.idleUpdateTimeout = null;
    }
    
    this.multiplayerClient = null;
    this.currentSprite = null;
  }
}
