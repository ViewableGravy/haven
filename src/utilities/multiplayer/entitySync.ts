  /***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../entities/base";
import type { HasGhostable, HasTransform } from "../../entities/interfaces";
import type { IPlaceableTrait } from "../../entities/traits/placeable";
import type { EntityData } from '../../server';
import type { Game } from "../game/game";
import { Position } from "../position";
import { entitySyncRegistry } from "./entitySyncRegistry";
import type { Container } from "pixi.js";

interface HasContainer {
  container: Container;
}

/***** ENTITY SYNC MANAGER *****/
export class EntitySyncManager {
  private game: Game;
  private remoteEntities: Map<string, BaseEntity> = new Map();

  constructor(game: Game) {
    this.game = game;
  }

  /***** ENTITY PLACEMENT *****/
  public handleRemoteEntityPlaced(entityData: EntityData): void {
    // Don't create if already exists
    if (this.remoteEntities.has(entityData.id)) {
      return;
    }

    console.log(`Attempting to place remote entity: ${entityData.type} at global (${entityData.x}, ${entityData.y})`);

    // Use registry to create entity
    const entity = entitySyncRegistry.createEntity(entityData, this.game);
    if (!entity) return;

    // Get the appropriate chunk using global coordinates
    const chunk = this.game.controllers.chunkManager.getChunk(entityData.x, entityData.y);
    
    // Convert global position to local chunk coordinates
    const globalPosition = new Position(entityData.x, entityData.y, "global");
    const localPosition = chunk.toLocalPosition(globalPosition);
    console.log(`Converted to local position: (${localPosition.x}, ${localPosition.y}) in chunk at (${chunk.getChunkPosition().x}, ${chunk.getChunkPosition().y})`);

    // Ensure entity is not in ghost mode (if it supports ghosting)
    if (this.hasGhostable(entity)) {
      entity.ghostMode = false;
    }

    // Set the entity's transform position to local coordinates
    if (this.hasTransform(entity)) {
      entity.transform.position.position = {
        x: localPosition.x,
        y: localPosition.y,
        type: "local"
      };
    }

    // Add to chunk and mark as placed
    if (this.hasContainer(entity)) {
      chunk.addChild(entity.container);
      
      // Mark entity as placed if it has the placeable trait
      if (this.hasPlaceable(entity)) {
        entity.place();
      }
    }
    
    // Add to entity manager and track as remote entity
    this.game.entityManager.addEntity(entity);
    this.remoteEntities.set(entityData.id, entity);

    console.log(`Successfully placed remote entity ${entityData.type} at local (${localPosition.x}, ${localPosition.y})`);
  }

  /***** TYPE GUARDS *****/
  private hasGhostable(entity: BaseEntity): entity is BaseEntity & HasGhostable {
    return 'ghostMode' in entity;
  }

  private hasTransform(entity: BaseEntity): entity is BaseEntity & HasTransform {
    return 'transform' in entity;
  }

  private hasContainer(entity: BaseEntity): entity is BaseEntity & HasContainer {
    return 'container' in entity;
  }

  private hasPlaceable(entity: BaseEntity): entity is BaseEntity & IPlaceableTrait {
    return 'place' in entity && typeof (entity as any).place === 'function';
  }

  /***** ENTITY REMOVAL *****/
  public handleRemoteEntityRemoved(entityId: string): void {
    const entity = this.remoteEntities.get(entityId);
    if (!entity) return;

    // Remove from chunk and game
    if (this.hasContainer(entity)) {
      entity.container.parent?.removeChild(entity.container);
    }
    
    this.game.entityManager.removeEntity(entity);
    this.remoteEntities.delete(entityId);

    console.log(`Remote entity ${entityId} removed`);
  }

  /***** ENTITY SYNC *****/
  public syncExistingEntities(entities: EntityData[]): void {
    // Clear existing remote entities
    this.clearRemoteEntities();

    // Add all entities from server
    entities.forEach(entityData => {
      this.handleRemoteEntityPlaced(entityData);
    });

    console.log(`Synced ${entities.length} entities from server`);
  }

  /***** CLEANUP *****/
  private clearRemoteEntities(): void {
    this.remoteEntities.forEach((_, id) => {
      this.handleRemoteEntityRemoved(id);
    });
  }

  public destroy(): void {
    this.clearRemoteEntities();
  }

  /***** GETTERS *****/
  public getRemoteEntityCount(): number {
    return this.remoteEntities.size;
  }
}