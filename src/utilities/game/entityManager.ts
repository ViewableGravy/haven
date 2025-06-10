/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import { ContainerTrait } from "../../objects/traits/container";
import { GhostableTrait } from "../../objects/traits/ghostable";
import { PlaceableTrait } from "../../objects/traits/placeable";
import type { HasTransformTrait } from "../../objects/traits/transform";
import type { ChunkKey } from "../tagged";
import type { Game } from "./game";

interface HasContainerTrait {
  containerTrait: ContainerTrait;
}

interface HasGhostableTrait {
  ghostableTrait: GhostableTrait;
}

interface HasPlaceableTrait {
  placeableTrait: PlaceableTrait;
}

type PlaceableEntity = GameObject & HasContainerTrait & HasGhostableTrait & HasPlaceableTrait & HasTransformTrait;

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
  private entities: Set<GameObject> = new Set();
  private entitiesByChunk: Map<ChunkKey, Set<GameObject>> = new Map();
  private placementListeners: Set<EntityPlacementListener> = new Set();
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /***** ENTITY TRACKING *****/
  public addEntity(entity: GameObject): void {
    this.entities.add(entity);
  }

  public removeEntity(entity: GameObject): void {
    this.entities.delete(entity);
  }

  public getEntities(): Set<GameObject> {
    return this.entities;
  }

  /***** CHUNK-BASED ENTITY MANAGEMENT *****/
  public setEntitiesForChunk(chunkKey: ChunkKey, entities: Set<GameObject>): void {
    this.entitiesByChunk.set(chunkKey, entities);
  }

  public getEntitiesForChunk(chunkKey: ChunkKey): Set<GameObject> | undefined {
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

      // Update entity state with global coordinates
      GhostableTrait.setGhostMode(entity, false);
      entity.transformTrait.position.position = {
        x: globalX,
        y: globalY,
        type: "global"
      };

      // Convert global position to local chunk coordinates for PIXI container positioning
      const { x, y } = chunk.toLocalPosition(entity.transformTrait.position);
      entity.containerTrait.container.x = x;
      entity.containerTrait.container.y = y;

      // Place entity in chunk and add to tracking
      chunk.addChild(entity.containerTrait.container);
      this.addEntity(entity);

      // Mark as placed
      PlaceableTrait.place(entity);

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
  private getEntityType(entity: GameObject): string {
    // Use the entity's built-in type identification
    return entity.getEntityType();
  }

  /***** CLEANUP *****/
  public clear(): void {
    this.entities.clear();
    this.entitiesByChunk.clear();
    this.placementListeners.clear();
  }
}