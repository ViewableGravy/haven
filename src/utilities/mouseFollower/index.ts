import type { GameObject } from "../../objects/base";
import { TransformTrait } from "../../objects/traits/transform";
import type { Game } from "../game/game";
import type { Position } from "../position";
import { Rectangle } from "../rectangle";

/***** TYPE DEFINITIONS *****/
type FollowableEntity = GameObject;
type CreatorFunction = (game: Game, position: Position) => any;

/***** MOUSE FOLLOWER CLASS *****/
export class MouseFollower {
  private isPlaceable = true;
  private entity: FollowableEntity;
  private game: Game;
  private actualCreatorFunction?: CreatorFunction;

  constructor(game: Game, entity: FollowableEntity, actualCreatorFunction?: CreatorFunction) {
    this.game = game;
    this.entity = entity;
    this.actualCreatorFunction = actualCreatorFunction;
  }
  public start(): () => void {
    this.bindEvents();
    
    // Add preview entity to entity layer 
    const layerManager = this.game.layerManager;
    layerManager.addToLayer(this.entity.getTrait('container').container, 'entity');
    
    // Immediately position the entity at the current cursor position
    this.updateEntityPosition();
    this.checkCollisions();
    
    return this.cleanup.bind(this);
  }

  private bindEvents(): void {
    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
  }

  private handleMouseMove = (): void => {
    this.updateEntityPosition();
    this.checkCollisions();
  }

  /***** POSITIONING LOGIC *****/
  private updateEntityPosition(): void {
    const tileSize = this.game.consts.tileSize;
    const entityWidth = this.entity.getTrait('position').size.width;
    const entityHeight = this.entity.getTrait('position').size.height;

    // Get the tile coordinates under the mouse
    const tileX = Math.floor(this.game.state.worldPointer.x / tileSize) * tileSize;
    const tileY = Math.floor(this.game.state.worldPointer.y / tileSize) * tileSize;

    // Handle different entity sizes
    if (entityWidth % tileSize * 2 && entityHeight % tileSize * 2) {
      this.position2x2Entity(tileX, tileY, tileSize);
    }
    if (entityWidth % tileSize === 0 && entityHeight % tileSize === 0) {
      this.centerEntityOnTile(tileX, tileY, entityWidth, entityHeight);
    }
    else {
      throw new Error(
        `Unsupported entity size: ${entityWidth}x${entityHeight}. Only 2x2 or multiples of tile size are supported.`
      );
    }
  }

  /***** 2X2 POSITIONING *****/
  private position2x2Entity(tileX: number, tileY: number, tileSize: number): void {
    const pointerTileDiffX = this.game.state.worldPointer.x - tileX;
    const pointerTileDiffY = this.game.state.worldPointer.y - tileY;

    // Determine the tile quadrant (q1, q2, q3, q4)
    const isQ1 = pointerTileDiffX < (tileSize / 2) && pointerTileDiffY < (tileSize / 2);
    const isQ2 = pointerTileDiffX > (tileSize / 2) && pointerTileDiffY < (tileSize / 2);
    const isQ3 = pointerTileDiffX < (tileSize / 2) && pointerTileDiffY > (tileSize / 2);
    const isQ4 = pointerTileDiffX > (tileSize / 2) && pointerTileDiffY > (tileSize / 2);

    // Apply the appropriate offset based on the quadrant
    switch (true) {
      case isQ1: {
        this.entity.getTrait('position').position.x = tileX - this.game.consts.tileSize;
        this.entity.getTrait('position').position.y = tileY - this.game.consts.tileSize;
        break;
      }
      case isQ2: {
        this.entity.getTrait('position').position.x = tileX;
        this.entity.getTrait('position').position.y = tileY - this.game.consts.tileSize;
        break;
      }
      case isQ3: {
        this.entity.getTrait('position').position.x = tileX - this.game.consts.tileSize;
        this.entity.getTrait('position').position.y = tileY;
        break;
      }
      case isQ4: {
        this.entity.getTrait('position').position.x = tileX;
        this.entity.getTrait('position').position.y = tileY;
        break;
      }
    }
  }

  /***** CENTERED POSITIONING *****/
  private centerEntityOnTile(tileX: number, tileY: number, entityWidth: number, entityHeight: number): void {
    // Center the entity on the tile under the mouse cursor
    this.entity.getTrait('position').position.x = tileX + (this.game.consts.tileSize - entityWidth) / 2;
    this.entity.getTrait('position').position.y = tileY + (this.game.consts.tileSize - entityHeight) / 2;
  }

  private checkCollisions(): void {
    // Set Mouse cursor to cross if overlapping with another entity
    for (const _entity of this.game.entityManager.getEntities()) {
      // Check if entity can intersect using Rectangle utility
      if (!Rectangle.canIntersect(_entity)) continue;

      // Check collision using the new transform system if available
      if (TransformTrait.is(_entity)) {
        if (this.entity.getTrait('position').intersects(_entity.getTrait('position'))) {
          this.isPlaceable = false;
          document.body.style.cursor = "not-allowed";
          break;
        } else {
          this.isPlaceable = true;
          document.body.style.cursor = "default";
        }
      } else {
        // Fallback for entities without transform - use Rectangle.intersects
        if (Rectangle.intersects(_entity, this.entity.getTrait('position').rectangle)) {
          this.isPlaceable = false;
          document.body.style.cursor = "not-allowed";
          break;
        } else {
          this.isPlaceable = true;
          document.body.style.cursor = "default";
        }
      }
    }
  }
  private handleMouseDown = async (): Promise<void> => {
    if (!this.isPlaceable) return;

    // Get current global position from the entity's transform
    const globalX = this.entity.getTrait('position').position.x;
    const globalY = this.entity.getTrait('position').position.y;
    if (this.actualCreatorFunction) {
        try {
        // Create networked entity at the placement position FIRST
        await this.actualCreatorFunction(this.game, { x: globalX, y: globalY, type: "global" });
        
        // Only cleanup preview entity AFTER successful creation
        this.cleanup();
      } catch (error) {
        console.error('MouseFollower: Failed to create networked entity:', error);
        // Don't cleanup on error so user can try again
      }
    } else {
      // This is a direct entity placement (legacy behavior)
      const placementSuccess = this.game.entityManager.placeEntity(
        this.entity,
        globalX,
        globalY
      );

      if (placementSuccess) {
        this.cleanup();
      } else {
        console.warn('Failed to place entity');
      }
    }
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.cleanup();
    }
  }
  private cleanup(): void {
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("keydown", this.handleKeydown);
    window.removeEventListener("mousedown", this.handleMouseDown);
    
    // Remove from layer system
    const layerManager = this.game.layerManager;
    layerManager.removeFromLayer(this.entity.getTrait('container').container);
  }
}