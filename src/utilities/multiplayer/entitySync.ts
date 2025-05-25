/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../entities/base";
import type { HasTransform } from "../../entities/interfaces";
import { ContainerTrait } from "../../entities/traits/container";
import { GhostableTrait } from "../../entities/traits/ghostable";
import { PlaceableTrait } from "../../entities/traits/placeable";
import type { EntityData } from '../../server';
import type { Game } from "../game/game";
import { Position } from "../position";
import { entitySyncRegistry } from "./entitySyncRegistry";

/***** ENTITY SYNC MANAGER *****/
export class EntitySyncManager {
  private game: Game;
  private remoteEntities: Map<string, BaseEntity> = new Map();
  private queuedEntities: EntityData[] = [];

  constructor(game: Game) {
    this.game = game;
    
    // Subscribe to chunk loading events to process queued entities
    this.setupChunkLoadListener();
  }

  /**
   * Set up listener for chunk loading to process queued entities
   */
  private setupChunkLoadListener(): void {
    // Check if chunk manager is available (it might not be during early initialization)
    if (this.game.controllers.chunkManager) {
      // Subscribe to chunk loaded events from the chunk manager
      this.game.controllers.chunkManager.subscribe((chunkLoadedEvent) => {
        console.log(`EntitySyncManager: Chunk ${chunkLoadedEvent.chunkKey} loaded, processing queued entities`);
        this.processQueuedEntities();
      });
      console.log('EntitySyncManager: Subscribed to chunk loading events');
    } else {
      // If chunk manager isn't ready yet, set up a delayed subscription
      console.log('EntitySyncManager: ChunkManager not ready, will subscribe later');
      const checkForChunkManager = () => {
        if (this.game.controllers.chunkManager) {
          this.game.controllers.chunkManager.subscribe((chunkLoadedEvent) => {
            console.log(`EntitySyncManager: Chunk ${chunkLoadedEvent.chunkKey} loaded, processing queued entities`);
            this.processQueuedEntities();
          });
          console.log('EntitySyncManager: Subscribed to chunk loading events (delayed)');
        } else {
          // Keep checking until chunk manager is available
          setTimeout(checkForChunkManager, 100);
        }
      };
      checkForChunkManager();
    }
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

    // Try to get the appropriate chunk using global coordinates
    // If chunk doesn't exist yet, queue this entity for later placement
    try {
      const chunk = this.game.controllers.chunkManager.getChunk(entityData.x, entityData.y);
      this.placeEntityInChunk(entity, entityData, chunk);
    } catch {
      console.log(`Chunk not loaded yet for entity ${entityData.type} at (${entityData.x}, ${entityData.y}), queueing for later`);
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
    console.log(`Converted to local position: (${localPosition.x}, ${localPosition.y}) in chunk at (${chunk.getChunkPosition().x}, ${chunk.getChunkPosition().y})`);

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

    console.log(`Successfully placed remote entity ${entityData.type} at local (${localPosition.x}, ${localPosition.y})`);
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

    console.log(`EntitySyncManager: Processing ${this.queuedEntities.length} queued entities`);
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
    
    if (remainingQueue.length > 0) {
      console.log(`EntitySyncManager: ${remainingQueue.length} entities still queued for placement`);
    } else {
      console.log('EntitySyncManager: All queued entities have been placed successfully');
    }
  }

  /***** TYPE GUARDS *****/
  private hasTransform(entity: BaseEntity): entity is BaseEntity & HasTransform {
    return 'transform' in entity;
  }

  /***** ENTITY REMOVAL *****/
  public handleRemoteEntityRemoved(entityId: string): void {
    const entity = this.remoteEntities.get(entityId);
    if (!entity) return;

    // Remove from chunk and game
    if (ContainerTrait.is(entity)) {
      entity.containerTrait.container.parent?.removeChild(entity.containerTrait.container);
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