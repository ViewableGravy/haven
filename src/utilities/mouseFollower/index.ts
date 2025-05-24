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

  private updateEntityPosition(): void {
    // Get the x/y of the tile 
    const tileX = Math.floor(this.game.state.worldPointer.x / this.game.consts.tileSize) * this.game.consts.tileSize;
    const tileY = Math.floor(this.game.state.worldPointer.y / this.game.consts.tileSize) * this.game.consts.tileSize;

    // get the distance cursor distance from x/y
    const pointerTileDiffX = this.game.state.worldPointer.x - tileX;
    const pointerTileDiffY = this.game.state.worldPointer.y - tileY;

    // Determine the tile quadrant (q1, q2, q3, q4)
    const isQ1 = pointerTileDiffX < (this.game.consts.tileSize / 2) && pointerTileDiffY < (this.game.consts.tileSize / 2);
    const isQ2 = pointerTileDiffX > (this.game.consts.tileSize / 2) && pointerTileDiffY < (this.game.consts.tileSize / 2);
    const isQ3 = pointerTileDiffX < (this.game.consts.tileSize / 2) && pointerTileDiffY > (this.game.consts.tileSize / 2);
    const isQ4 = pointerTileDiffX > (this.game.consts.tileSize / 2) && pointerTileDiffY > (this.game.consts.tileSize / 2);

    // Apply the appropriate offset based on the quadrant
    switch (true) {
      case isQ1: {
        this.entity.transform.position.x = tileX - this.entity.transform.size.width / 2;
        this.entity.transform.position.y = tileY - this.entity.transform.size.width / 2;
        break;
      }
      case isQ2: {
        this.entity.transform.position.x = tileX;
        this.entity.transform.position.y = tileY - this.entity.transform.size.width / 2;
        break;
      }
      case isQ3: {
        this.entity.transform.position.x = tileX - this.entity.transform.size.width / 2;
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
      this.game.state.worldPointer.x, 
      this.game.state.worldPointer.y
    );

    const position = chunk.getGlobalPosition();

    const chunkGlobalX = position.x - this.game.state.worldOffset.x;
    const chunkGlobalY = position.y - this.game.state.worldOffset.y;
    
    const chunkRelativeX = this.entity.container.x - chunkGlobalX;
    const chunkRelativeY = this.entity.container.y - chunkGlobalY;

    this.entity.ghostMode = false;
    this.entity.transform.position.position = {
      x: chunkRelativeX,
      y: chunkRelativeY,
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