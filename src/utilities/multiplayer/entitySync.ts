/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../entities/base";
import type { HasTransform } from "../../entities/interfaces";
import { ContainerTrait } from "../../entities/traits/container";
import { GhostableTrait } from "../../entities/traits/ghostable";
import { PlaceableTrait } from "../../entities/traits/placeable";
import type { EntityData } from "../../server/types";
import type { Game } from "../game/game";
import { Position } from "../position";
import { entitySyncRegistry } from "./entitySyncRegistry";

/***** ENTITY SYNC MANAGER *****/
export class EntitySyncManager {
  private game: Game;
  private remoteEntities: Map<string, BaseEntity> = new Map();
  private queuedEntities: EntityData[] = [];
  private isReady: boolean = false;
  private chunkLoadSubscription: (() => void) | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  /***** INITIALIZATION *****/
  public initialize(): void {
    if (this.isReady) return;
    
    this.setupChunkLoadListener();
    this.setupEntityPlacementListener();
    this.isReady = true;
    
    // Process any entities that were queued before initialization
    if (this.queuedEntities.length > 0) {
      this.processQueuedEntities();
    }
  }

  /***** ENTITY PLACEMENT INTEGRATION *****/
  private setupEntityPlacementListener(): void {
    // Listen to local entity placements and notify server
    this.game.entityManager.onEntityPlacement((event) => {
      // Only notify server for locally placed entities (not remote ones)
      if (!event.entity.isRemoteEntity) {
        this.notifyServerEntityPlaced(
          event.entity, 
          event.globalPosition.x, 
          event.globalPosition.y
        );
      }
    });
  }

  /***** WORLD POSITION API *****/
  // "I don't care about chunks" API
  public placeEntityAtWorldPosition(
    _entityType: string, 
    _worldX: number, 
    _worldY: number
  ): BaseEntity | null {
    // For now, use the existing entity placement through EntityManager
    // This would need to be implemented in EntityManager as a future enhancement
    console.warn('placeEntityAtWorldPosition not yet implemented in EntityManager');
    return null;
  }

  /***** SERVER NOTIFICATION *****/
  private notifyServerEntityPlaced(entity: BaseEntity, worldX: number, worldY: number): void {
    // Calculate chunk coordinates for server
    const chunkX = Math.floor(worldX / this.game.consts.chunkAbsolute);
    const chunkY = Math.floor(worldY / this.game.consts.chunkAbsolute);
    
    // Send to server via multiplayer client
    this.game.controllers.multiplayer?.client.sendEntityPlace?.(
      entity.getEntityType(),
      worldX,
      worldY,
      chunkX,
      chunkY
    );
  }

  /**
   * Set up listener for chunk loading to process queued entities
   */
  private setupChunkLoadListener(): void {
    // Ensure chunk manager is available
    if (!this.game.controllers.chunkManager) {
      return;
    }

    // Subscribe to chunk loaded events from the chunk manager
    this.chunkLoadSubscription = this.game.controllers.chunkManager.subscribe((_chunkLoadedEvent) => {
      this.processQueuedEntities();
    });
  }

  /***** REMOTE ENTITY HANDLING *****/
  public handleRemoteEntityPlaced(entityData: EntityData): void {
    // Server tells us about entity at world position
    // EntityManager figures out which chunk it belongs to
    
    // If not ready yet, queue the entity
    if (!this.isReady) {
      this.queueEntityForLaterPlacement(entityData);
      return;
    }

    // Don't create if already exists
    if (this.remoteEntities.has(entityData.id)) {
      return;
    }

    // Use registry to create entity
    const entity = entitySyncRegistry.createEntity(entityData, this.game);
    if (!entity) return;

    // Try to get the appropriate chunk using global coordinates
    // If chunk doesn't exist yet, queue this entity for later placement
    try {
      entityData.chunkX
      const chunk = this.game.controllers.chunkManager.getChunk(entityData.x, entityData.y);
      this.placeEntityInChunk(entity, entityData, chunk);
    } catch {
      this.queueEntityForLaterPlacement(entityData);
      return;
    }
  }

  /**
   * Actually places an entity in a chunk
   */
  private placeEntityInChunk(entity: any, entityData: EntityData, chunk: any): void {

    // Convert global position to local chunk coordinates
    const globalPosition = new Position(entityData.x, entityData.y, "global");
    const localPosition = chunk.toLocalPosition(globalPosition);

    // Ensure entity is not in ghost mode (if it supports ghosting)
    GhostableTrait.setGhostMode(entity, false);

    // Set the entity's transform position to local coordinates
    if (this.hasTransform(entity)) {
      entity.transform.position.position = {
        x: localPosition.x,
        y: localPosition.y,
        type: "local"
      };
    }

    // Add to chunk and mark as placed
    if (ContainerTrait.is(entity)) {
      chunk.addChild(entity.containerTrait.container);

      // Mark entity as placed if it has the placeable trait
      PlaceableTrait.place(entity);
    }

    // Add to entity manager and track as remote entity
    this.game.entityManager.addEntity(entity);
    this.remoteEntities.set(entityData.id, entity);
  }

  /**
   * Queue an entity for later placement when its chunk loads
   */
  private queueEntityForLaterPlacement(entityData: EntityData): void {
    this.queuedEntities.push(entityData);
  }

  /**
   * Try to place any queued entities (called when new chunks load)
   */
  public processQueuedEntities(): void {
    if (this.queuedEntities.length === 0) {
      return;
    }

    const remainingQueue: EntityData[] = [];
    
    this.queuedEntities.forEach(entityData => {
      try {
        // Try to place the entity again
        this.handleRemoteEntityPlaced(entityData);
      } catch {
        // Still can't place it, keep it in queue
        remainingQueue.push(entityData);
      }
    });
    
    this.queuedEntities = remainingQueue;
  }

  /***** TYPE GUARDS *****/
  private hasTransform(entity: BaseEntity): entity is BaseEntity & HasTransform {
    return 'transform' in entity;
  }

  /***** ENTITY REMOVAL *****/
  public handleRemoteEntityRemoved(data: { id: string }): void {
    const entity = this.remoteEntities.get(data.id);
    if (entity) {
      // Remove from chunk and game
      if (ContainerTrait.is(entity)) {
        entity.containerTrait.container.parent?.removeChild(entity.containerTrait.container);
      }

      this.game.entityManager.removeEntity(entity);
      this.remoteEntities.delete(data.id);
    }
  }

  /***** ENTITY SYNC *****/
  public syncExistingEntities(entities: EntityData[]): void {
    // Clear existing remote entities
    this.clearRemoteEntities();

    // If not ready yet, queue all entities
    if (!this.isReady) {
      this.queuedEntities.push(...entities);
      return;
    }

    // Add all entities from server
    entities.forEach(entityData => {
      this.handleRemoteEntityPlaced(entityData);
    });
  }

  /***** CLEANUP *****/
  private clearRemoteEntities(): void {
    this.remoteEntities.forEach((_, id) => {
      this.handleRemoteEntityRemoved({ id });
    });
  }

  /**
   * Handle chunk unloading by cleaning up entity references for that chunk
   * This prevents duplicate detection when chunks are reloaded
   * @param chunkKey - The key of the chunk being unloaded
   */
  public handleChunkUnload(chunkKey: string): void {
    const entitiesToRemove: Array<string> = [];
    
    // Parse chunk coordinates from the key
    const [chunkX, chunkY] = chunkKey.split(',').map(Number);
    
    // Find all entities that belong to this chunk
    this.remoteEntities.forEach((entity, entityId) => {
      // Get entity's world position to determine which chunk it belongs to
      if (this.hasTransform(entity)) {
        const transform = entity.transform;
        const worldX = transform.position.position.x;
        const worldY = transform.position.position.y;
        
        // Skip if position is undefined
        if (worldX === undefined || worldY === undefined) {
          return;
        }
        
        // Calculate which chunk this entity belongs to
        const entityChunkX = Math.floor(worldX / this.game.consts.chunkAbsolute);
        const entityChunkY = Math.floor(worldY / this.game.consts.chunkAbsolute);
        
        // If this entity belongs to the unloading chunk, mark it for removal
        if (entityChunkX === chunkX && entityChunkY === chunkY) {
          entitiesToRemove.push(entityId);
        }
      }
    });
    
    // Remove the entity references from our tracking
    entitiesToRemove.forEach((entityId) => {
      this.remoteEntities.delete(entityId);
    });
  }

  public destroy(): void {
    this.clearRemoteEntities();
    
    // Unsubscribe from chunk loading events
    if (this.chunkLoadSubscription) {
      this.chunkLoadSubscription();
      this.chunkLoadSubscription = null;
    }
    
    this.isReady = false;
  }

  /***** GETTERS *****/
  public getRemoteEntityCount(): number {
    return this.remoteEntities.size;
  }
}