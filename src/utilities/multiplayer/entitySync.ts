/***** TYPE DEFINITIONS *****/
import invariant from "tiny-invariant";
import type { GameObject } from "../../objects/base";
import { ContainerTrait } from "../../objects/traits/container";
import { GhostableTrait } from "../../objects/traits/ghostable";
import { PlaceableTrait } from "../../objects/traits/placeable";
import { TransformTrait } from "../../objects/traits/transform";
import type { EntityData } from "../../server/types";
import type { Chunk } from "../../systems/chunkManager/chunk";
import type { Game } from "../game/game";
import { entitySyncRegistry } from "./entitySyncRegistry";

/***** ENTITY SYNC MANAGER *****/
export class EntitySyncManager {
  private game: Game;
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
      // Only notify server for locally placed entities (not server-generated ones)
      if (!event.entity.multiplayerId) {
        this.notifyServerEntityPlaced(
          event.entity, 
          event.globalPosition.x, 
          event.globalPosition.y
        );
      }
    });
  }

  /***** SERVER NOTIFICATION *****/
  private notifyServerEntityPlaced(entity: GameObject, worldX: number, worldY: number): void {
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
    this.chunkLoadSubscription = this.game.controllers.chunkManager.subscribe(() => {
      this.processQueuedEntities();
    });
  }

  /***** UTILITY METHODS *****/
  /**
   * Find an entity by its multiplayer ID in the unified entity system
   */
  private findEntityById(multiplayerId: string): GameObject | null {
    for (const entity of this.game.entityManager.getEntities()) {
      if (entity.getMultiplayerId() === multiplayerId) {
        return entity;
      }
    }
    return null;
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

    // Check if entity already exists in the unified entity system
    const existingEntity = this.findEntityById(entityData.id);
    if (existingEntity) {
      return;
    }

    // Use registry to create entity
    const entity = entitySyncRegistry.createEntity(entityData, this.game);
    if (!entity) return;

    // Try to get the appropriate chunk using global coordinates
    // If chunk doesn't exist yet, queue this entity for later placement
    try {
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
  private placeEntityInChunk(entity: GameObject, entityData: EntityData, chunk: Chunk): void {
    // Ensure entity is not in ghost mode (if it supports ghosting)
    GhostableTrait.setGhostMode(entity, false);

    // Set the entity's transform position to global coordinates
    invariant(TransformTrait.is(entity), "Entities must have a transform trait to set position");
    invariant(ContainerTrait.is(entity), "Entities must have a container trait to be placed in a chunk");

    const { position } = entity.getTrait('position');
    const { container } = entity.getTrait('container');

    position.position = {
      x: entityData.x,
      y: entityData.y,
      type: "global"
    };

    // Add to chunk and mark as placed
    const { x, y } = chunk.toLocalPosition(position);
    container.x = x;
    container.y = y;

    chunk.addChild(container);

    // Mark entity as placed if it has the placeable trait
    PlaceableTrait.place(entity);

    // Check if entity already has NetworkTrait (from new pattern)
    // If not, add to EntityManager manually (legacy pattern)
    try {
      entity.getTrait('network');
      // Entity has NetworkTrait, it will manage itself
    } catch {
      // Entity doesn't have NetworkTrait, add to EntityManager manually
      this.game.entityManager.addEntity(entity);
    }
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

  /***** ENTITY REMOVAL *****/
  public handleRemoteEntityRemoved(data: { id: string }): void {
    const entity = this.findEntityById(data.id);
    if (entity) {
      // Remove from chunk and game
      if (ContainerTrait.is(entity)) {
        entity.getTrait('container').container.parent?.removeChild(entity.getTrait('container').container);
      }

      this.game.entityManager.removeEntity(entity);
    }
  }

  /***** ENTITY SYNC *****/
  public syncExistingEntities(entities: EntityData[]): void {
    // Clear existing server entities (if any)
    this.clearServerEntities();

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
  private clearServerEntities(): void {
    for (const entity of this.game.entityManager.getEntities()) {
      // Remove entities that have a multiplayer ID (came from server)
      if (entity.multiplayerId) {
        this.handleRemoteEntityRemoved({ id: entity.getMultiplayerId() })
      }
    }
  }

  /**
   * Handle chunk unloading by cleaning up entity references for that chunk
   * This prevents duplicate detection when chunks are reloaded
   * 
   * TODO: There is still a lot of performance left on the table here, since
   * we are iterating through all entities rather than just the ones
   * that are in the chunk being unloaded. This is fine for now, but should
   * create a quad tree to store entities by chunk coordinates, or 
   * simply store them in a cache based on chunk coordinates.
   * 
   * @param chunkKey - The key of the chunk being unloaded
   */
  public handleChunkUnload(chunkKey: string): void {    
    // Parse chunk coordinates from the key
    const [chunkX, chunkY] = chunkKey.split(',').map(Number);
    
    // Find all entities that belong to this chunk
    for (const entity of this.game.entityManager.getEntities()) {
      // Get entity's world position to determine which chunk it belongs to
      if (TransformTrait.is(entity)) {
        const worldX = entity.getTrait('position').position.position.x;
        const worldY = entity.getTrait('position').position.position.y;
        
        // Skip if position is undefined
        if (worldX === undefined || worldY === undefined) {
          continue;
        }
        
        // Calculate which chunk this entity belongs to
        const entityChunkX = Math.floor(worldX / this.game.consts.chunkAbsolute);
        const entityChunkY = Math.floor(worldY / this.game.consts.chunkAbsolute);
        
        // If this entity belongs to the unloading chunk and came from server, mark it for removal
        if (entityChunkX === chunkX && entityChunkY === chunkY && entity.multiplayerId) {
          this.handleRemoteEntityRemoved({ id: entity.getMultiplayerId() })
        }
      }
    }
  }

  public destroy(): void {
    this.clearServerEntities();
    
    // Unsubscribe from chunk loading events
    if (this.chunkLoadSubscription) {
      this.chunkLoadSubscription();
      this.chunkLoadSubscription = null;
    }
    
    this.isReady = false;
  }

  /***** GETTERS *****/
  public getServerEntityCount(): number {
    let count = 0;
    for (const entity of this.game.entityManager.getEntities()) {
      if (entity.multiplayerId) {
        count++;
      }
    }
    return count;
  }
}