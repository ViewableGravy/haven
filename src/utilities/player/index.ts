import { AnimatedSprite, Point, type Ticker } from "pixi.js";
import type { SetOptional } from "type-fest";
import { Rectangle } from "utilities/rectangle";
import { TransformTrait } from "../../objects/traits/transform";
import { CharacterSprite } from "../../spriteSheets/character";
import { RunningSprite } from "../../spriteSheets/running";
import type { Game } from "../game/game";
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

/***** PLAYER CLASS *****/
export class Player {
  private controller: KeyboardController;
  public position: SubscribablePosition;
  private currentSprite: AnimatedSprite | null = null;
  private currentDirection: MovementDirection = 'idle';
  
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
  public initializeSprite = (): AnimatedSprite => {
    if (this.currentSprite) {
      return this.currentSprite;
    }

    const idleFrames = CharacterSprite.getSpriteSheet().animations['idle'];
    this.currentSprite = new AnimatedSprite(idleFrames);
    this.currentSprite.animationSpeed = 1.0;
    this.currentSprite.play();
    this.currentDirection = 'idle';

    return this.currentSprite;
  }

  /**
   * Get the current sprite for rendering
   */
  public getSprite = (): AnimatedSprite | null => {
    return this.currentSprite;
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
      const idleFrames = CharacterSprite.getSpriteSheet().animations['idle'];
      this.currentSprite.textures = idleFrames;
    } else {
      // Switch to running animation for the specific direction
      const runningFrames = RunningSprite.getSpriteSheet().animations[`running-${direction}`];
      if (runningFrames) {
        this.currentSprite.textures = runningFrames;
      }
    }

    this.currentSprite.play();
  }  /***** COLLISION DETECTION *****/
  /**
   * Check if moving to a new position would collide with any solid entities
   * Treats the player as a point (10px from bottom of sprite) for collision
   */
  private checkCollision = (game: Game, newX: number, newY: number): boolean => {
    // Player sprite is 80px tall and anchored at center (0.5, 0.5)
    // So the bottom of the sprite is at position.y + 40px
    // We want our collision point to be 10px from the bottom
    const playerCollisionPoint = new Point(newX, newY);

    // Check collision with all entities that have collision
    for (const entity of game.entityManager.getEntities()) {
      // Skip if entity doesn't have transform trait (position + size)
      if (!TransformTrait.is(entity)) continue;
      
      const entityTransform = entity.getTrait('position');
      const rect = entityTransform.rectangle;
      
      if (Rectangle.contains(rect, playerCollisionPoint)) {
        return true; // Collision detected
      }
    }

    return false; // No collision
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

  public handleMovement = (game: Game, ticker: Ticker) => {
    const baseSpeed = 10 * ticker.deltaTime / game.state.zoom;
    const direction = this.getMovementDirection();
    const isCurrentlyMoving = this.isMoving();

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
    if (deltaX !== 0 && deltaY !== 0) {
      // Apply diagonal normalization factor (1/√2 ≈ 0.707)
      const diagonalFactor = Math.sqrt(2) / 2;
      deltaX *= diagonalFactor;
      deltaY *= diagonalFactor;
    }

    // Calculate the final movement deltas
    const finalDeltaX = deltaX * baseSpeed;
    const finalDeltaY = deltaY * baseSpeed;

    // Get current position
    const currentX = this.position.x;
    const currentY = this.position.y;

    // Check collision for the new position
    const newX = currentX + finalDeltaX;
    const newY = currentY + finalDeltaY;    // Only apply movement if no collision detected
    const hasCollision = this.checkCollision(game, newX, newY);
    
    if (!hasCollision) {
      this.position.x = newX;
      this.position.y = newY;
    } else {
      // Try moving on individual axes to allow sliding along walls
      const tryMoveX = currentX + finalDeltaX;
      const tryMoveY = currentY + finalDeltaY;

      // Try moving only on X axis
      if (finalDeltaX !== 0 && !this.checkCollision(game, tryMoveX, currentY)) {
        this.position.x = tryMoveX;
      }
      // Try moving only on Y axis  
      else if (finalDeltaY !== 0 && !this.checkCollision(game, currentX, tryMoveY)) {
        this.position.y = tryMoveY;
      }
      
      // If both axes blocked, don't move at all
    }
  }
}
