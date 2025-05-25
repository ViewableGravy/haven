import type { BaseEntity } from "../../entities/base";
import type { HasContainer, HasGhostable, HasTransform } from "../../entities/interfaces";
import { hasTransform } from "../../entities/interfaces";
import type { PlaceableTrait } from "../../entities/traits/placeable";
import type { Game } from "../game/game";
import { Rectangle } from "../rectangle";

/***** TYPE DEFINITIONS *****/
type FollowableEntity = BaseEntity & HasGhostable & HasContainer & HasTransform & PlaceableTrait;

/***** MOUSE FOLLOWER CLASS *****/
export class MouseFollower {
  private isPlaceable = true;
  private entity: FollowableEntity;
  private game: Game;

  constructor(game: Game, entity: FollowableEntity) {
    this.game = game;
    this.entity = entity;
  }

  public start(): () => void {
    this.bindEvents();
    this.game.world.addChild(this.entity.container);
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
    const entityWidth = this.entity.transform.size.width;
    const entityHeight = this.entity.transform.size.height;
    
    // Calculate entity size in tiles
    const entityWidthInTiles = Math.round(entityWidth / tileSize);
    const entityHeightInTiles = Math.round(entityHeight / tileSize);
    
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
        this.entity.transform.position.x = tileX - this.game.consts.tileSize;
        this.entity.transform.position.y = tileY - this.game.consts.tileSize;
        break;
      }
      case isQ2: {
        this.entity.transform.position.x = tileX;
        this.entity.transform.position.y = tileY - this.game.consts.tileSize;
        break;
      }
      case isQ3: {
        this.entity.transform.position.x = tileX - this.game.consts.tileSize;
        this.entity.transform.position.y = tileY;
        break;
      }
      case isQ4: {
        this.entity.transform.position.x = tileX;
        this.entity.transform.position.y = tileY;
        break;
      }
    }
  }

  /***** CENTERED POSITIONING *****/
  private centerEntityOnTile(tileX: number, tileY: number, entityWidth: number, entityHeight: number): void {
    // Center the entity on the tile under the mouse cursor
    this.entity.transform.position.x = tileX + (this.game.consts.tileSize - entityWidth) / 2;
    this.entity.transform.position.y = tileY + (this.game.consts.tileSize - entityHeight) / 2;
  }

  private checkCollisions(): void {
    // Set Mouse cursor to cross if overlapping with another entity
    for (const _entity of this.game.entityManager.getEntities()) {
      // Check if entity can intersect using Rectangle utility
      if (!Rectangle.canIntersect(_entity)) continue;

      // Check collision using the new transform system if available
      if (hasTransform(_entity)) {
        if (this.entity.transform.intersects(_entity.transform)) {
          this.isPlaceable = false;
          document.body.style.cursor = "not-allowed";
          break;
        } else {
          this.isPlaceable = true;
          document.body.style.cursor = "default";
        }
      } else {
        // Fallback for entities without transform - use Rectangle.intersects
        if (Rectangle.intersects(_entity, this.entity.transform.rectangle)) {
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

  private handleMouseDown = (): void => {
    if (!this.isPlaceable) return;

    const chunk = this.game.controllers.chunkManager.getChunk(
      this.entity.transform.position.x, 
      this.entity.transform.position.y
    );

    // Use the new toLocalPosition method to convert world coordinates to chunk-local coordinates
    const localPosition = chunk.toLocalPosition(this.entity.transform.position);

    this.entity.ghostMode = false;
    this.entity.transform.position.position = {
      x: localPosition.x,
      y: localPosition.y,
      type: "local"
    }

    chunk.addChild(this.entity.container);
    this.game.entityManager.addEntity(this.entity);

    // Remove all event listeners
    this.cleanup();
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
    this.game.world.removeChild(this.entity.container);
  }
}