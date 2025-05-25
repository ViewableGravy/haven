/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../entities/base";
import type { HasContainer, HasGhostable, HasTransform } from "../../entities/interfaces";
import type { IPlaceableTrait } from "../../entities/traits/placeable";
import type { ChunkKey } from "../tagged";
import type { Game } from "./game";

type PlaceableEntity = BaseEntity & HasContainer & HasTransform & HasGhostable & IPlaceableTrait;

interface EntityPlacementEvent {
  entity: PlaceableEntity;
  globalPosition: { x: number; y: number };
  chunkX: number;
  chunkY: number;
  entityType: string;
}

type EntityPlacementListener = (event: EntityPlacementEvent) => void;

/***** ENTITY MANAGER *****/
export class EntityManager {
  private entities: Set<BaseEntity> = new Set();
  private entitiesByChunk: Map<ChunkKey, Set<BaseEntity>> = new Map();
  private placementListeners: Set<EntityPlacementListener> = new Set();
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /***** ENTITY TRACKING *****/
  public addEntity(entity: BaseEntity): void {
    this.entities.add(entity);
  }

  public removeEntity(entity: BaseEntity): void {
    this.entities.delete(entity);
  }

  public getEntities(): Set<BaseEntity> {
    return this.entities;
  }

  /***** CHUNK-BASED ENTITY MANAGEMENT *****/
  public setEntitiesForChunk(chunkKey: ChunkKey, entities: Set<BaseEntity>): void {
    this.entitiesByChunk.set(chunkKey, entities);
  }

  public getEntitiesForChunk(chunkKey: ChunkKey): Set<BaseEntity> | undefined {
    return this.entitiesByChunk.get(chunkKey);
  }

  public removeEntitiesForChunk(chunkKey: ChunkKey): void {
    this.entitiesByChunk.delete(chunkKey);
  }

  /***** ENTITY PLACEMENT *****/
  public placeEntity(entity: PlaceableEntity, globalX: number, globalY: number): boolean {
    try {
      // Store global position before conversion
      const globalPosition = { x: globalX, y: globalY };

      // Get appropriate chunk
      const chunk = this.game.controllers.chunkManager.getChunk(globalX, globalY);
      
      // Convert to local chunk coordinates
      const localPosition = chunk.toLocalPosition({ x: globalX, y: globalY, type: "global" });

      // Update entity state
      entity.ghostMode = false;
      entity.transform.position.position = {
        x: localPosition.x,
        y: localPosition.y,
        type: "local"
      };

      // Place entity in chunk and add to tracking
      chunk.addChild(entity.container);
      this.addEntity(entity);

      // Mark as placed
      if (entity.place) {
        entity.place();
      }

      // Calculate chunk coordinates for multiplayer
      const chunkSize = this.game.consts.chunkAbsolute;
      const chunkX = Math.floor(globalX / chunkSize);
      const chunkY = Math.floor(globalY / chunkSize);

      // Notify placement listeners (including multiplayer)
      const placementEvent: EntityPlacementEvent = {
        entity,
        globalPosition,
        chunkX,
        chunkY,
        entityType: this.getEntityType(entity)
      };

      this.notifyPlacementListeners(placementEvent);

      return true;
    } catch (error) {
      console.error('Failed to place entity:', error);
      return false;
    }
  }

  /***** EVENT LISTENERS *****/
  public onEntityPlacement(listener: EntityPlacementListener): void {
    this.placementListeners.add(listener);
  }

  public offEntityPlacement(listener: EntityPlacementListener): void {
    this.placementListeners.delete(listener);
  }

  private notifyPlacementListeners(event: EntityPlacementEvent): void {
    this.placementListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
      console.error('Error in placement listener:', error);
      }
    });
  }

  /***** UTILITY METHODS *****/
  private getEntityType(entity: any): string {
    // Use the entity's built-in type identification
    if (entity.getEntityType && typeof entity.getEntityType === 'function') {
      return entity.getEntityType();
    }
    
    // Fallback for entities that don't implement getEntityType
    console.warn('Entity does not implement getEntityType method, using fallback detection');
    return 'unknown';
  }

  /***** CLEANUP *****/
  public clear(): void {
    this.entities.clear();
    this.entitiesByChunk.clear();
    this.placementListeners.clear();
  }
}