/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import { GhostableTrait } from "../../objects/traits/ghostable";
import { PlaceableTrait } from "../../objects/traits/placeable";
import type { ChunkKey } from "../tagged";
import type { Game } from "./game";

type PlaceableEntity = GameObject;

interface EntityPlacementEvent {
  entity: PlaceableEntity;
  globalPosition: { x: number; y: number };
  chunkX: number;
  chunkY: number;
  entityType: string;
}

type EntityPlacementListener = (event: EntityPlacementEvent) => void;
type EntityDestroyCallback = (notifyServer: boolean) => void;

/***** ENTITY MANAGER *****/
export class EntityManager {
  private entities: Set<GameObject> = new Set();
  private entitiesByChunk: Map<ChunkKey, Set<GameObject>> = new Map();
  private placementListeners: Set<EntityPlacementListener> = new Set();
  private destroyCallbacks: Map<GameObject, Set<EntityDestroyCallback>> = new Map();
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }
  /***** ENTITY TRACKING *****/
  public addEntity(entity: GameObject): void {
    this.entities.add(entity);
    
    // Register with power system if entity has powered trait
    if (entity.hasTrait('powered')) {
      try {
        this.game.powerManager.registerEntity(entity);
      } catch (error) {
        console.error('Failed to register entity with power system:', error);
      }
    }
  }
    public removeEntity(entity: GameObject, notifyServer: boolean = true): void {
    // Call any registered destroy callbacks first
    this.executeDestroyCallbacks(entity, notifyServer);
    
    // Unregister from power system if entity has powered trait
    if (entity.hasTrait('powered')) {
      try {
        this.game.powerManager.unregisterEntity(entity.uid);
      } catch (error) {
        console.error('Failed to unregister entity from power system:', error);
      }
    }
    
    // Remove from layer system before destroying
    if (entity.hasTrait("container")) {
      const container = entity.getTrait('container').container;
      const layerManager = this.game.layerManager;
      layerManager.removeFromLayer(container);
    }
    
    // Clean up entity traits after removing from display
    // Pass notifyServer flag to entity destroy method
    try {
      if (entity.destroy) {
        entity.destroy(notifyServer);
      }
    } catch (error) {
      console.error('Error destroying entity:', error);
    }
    
    this.entities.delete(entity);
    
    // Clean up destroy callback references
    this.destroyCallbacks.delete(entity);
  }

  public getEntities(): Set<GameObject> {
    return new Set(this.entities);
  }

  /***** DESTROY CALLBACK MANAGEMENT *****/
  public onEntityDestroy(entity: GameObject, callback: EntityDestroyCallback): void {
    if (!this.destroyCallbacks.has(entity)) {
      this.destroyCallbacks.set(entity, new Set());
    }
    this.destroyCallbacks.get(entity)!.add(callback);
  }

  public offEntityDestroy(entity: GameObject, callback: EntityDestroyCallback): void {
    const callbacks = this.destroyCallbacks.get(entity);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.destroyCallbacks.delete(entity);
      }
    }
  }

  private executeDestroyCallbacks(entity: GameObject, notifyServer: boolean): void {
    const callbacks = this.destroyCallbacks.get(entity);
    if (callbacks) {
      for (const callback of callbacks) {
        // Execute each callback, passing the notifyServer flag
        try {
          callback(notifyServer);
        } catch (error) {
          console.error('Error executing destroy callback:', error);
        }
      }
    }
  }

  /***** CHUNK-BASED ENTITY MANAGEMENT *****/
  public setEntitiesForChunk(chunkKey: ChunkKey, entities: Set<GameObject>): void {
    this.entitiesByChunk.set(chunkKey, entities);
  }

  public getEntitiesForChunk(chunkKey: ChunkKey): Set<GameObject> | undefined {
    return this.entitiesByChunk.get(chunkKey);
  }
  public removeEntitiesForChunk(chunkKey: ChunkKey): void {
    const entities = this.entitiesByChunk.get(chunkKey);
    if (entities) {
      for (const entity of entities) {
        // Don't notify server when removing entities due to chunk unloading
        this.removeEntity(entity, false);
      }
    }
    
    // Remove the chunk mapping
    this.entitiesByChunk.delete(chunkKey);
  }

  /***** ENTITY PLACEMENT *****/
  public placeEntity(entity: PlaceableEntity, globalX: number, globalY: number): boolean {
    try {
      // Store global position before conversion
      const globalPosition = { x: globalX, y: globalY };

      // Update entity state with global coordinates
      GhostableTrait.setGhostMode(entity, false);
      entity.getTrait('position').position.position = {
        x: globalX,
        y: globalY,
        type: "global"
      };

      // Place entity directly on main entity stage with global coordinates
      const container = entity.getTrait('container').container;
      container.x = globalX;
      container.y = globalY;      // Add to entity layer for proper depth sorting
      const layerManager = this.game.layerManager;
      layerManager.addToLayer(container, 'entity');
      this.addEntity(entity);

      // Mark as placed
      PlaceableTrait.place(entity);

      // Calculate chunk coordinates for multiplayer tracking
      const chunkSize = this.game.consts.chunkAbsolute;
      const chunkX = Math.floor(globalX / chunkSize);
      const chunkY = Math.floor(globalY / chunkSize);

      // Add entity to chunk tracking (for cleanup purposes)
      const chunkKey = `${chunkX},${chunkY}` as any;
      let chunkEntities = this.entitiesByChunk.get(chunkKey);
      if (!chunkEntities) {
        chunkEntities = new Set();
        this.entitiesByChunk.set(chunkKey, chunkEntities);
      }
      chunkEntities.add(entity);

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
    this.destroyCallbacks.clear();
  }
}