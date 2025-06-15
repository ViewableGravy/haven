/***** TYPE DEFINITIONS *****/
import invariant from "tiny-invariant";
import type { GameObject } from "../../objects/base";
import { ContainerTrait } from "../../objects/traits/container";
import { GhostableTrait } from "../../objects/traits/ghostable";
import { PlaceableTrait } from "../../objects/traits/placeable";
import { TransformTrait } from "../../objects/traits/transform";
import type { EntityData } from "../../server/types";
import type { Game } from "../game/game";
import { WorldObjects } from "../../worldObjects";
import { Logger } from "../Logger";

/***** ENTITY TYPE MAPPING *****/
const ENTITY_TYPE_MAP = {
  "assembler": "assembler",
  "spruce-tree": "spruceTree"
} as const;

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
      this.processQueuedEntities().catch(error => {
        console.error('Failed to process queued entities:', error);
      });
    }
  }
  /***** ENTITY PLACEMENT INTEGRATION *****/
  private setupEntityPlacementListener(): void {
    // Entity placement notifications are handled by World.createNetworkedEntity
    // No need to listen for placement events here to avoid duplicate entity_placed events
  }
  /***** SERVER NOTIFICATION *****/
  // Entity creation notifications are handled by World.createNetworkedEntity
  // to avoid duplicate entity_placed events

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
      this.processQueuedEntities().catch(error => {
        console.error('Failed to process queued entities on chunk load:', error);
      });
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
  public async handleRemoteEntityPlaced(entityData: EntityData): Promise<void> {
    Logger.log(`EntitySync: Received remote entity placement: ${JSON.stringify(entityData)}`);
    
    // Server tells us about entity at world position
    // EntityManager figures out which chunk it belongs to
    
    // If not ready yet, queue the entity
    if (!this.isReady) {
      Logger.log('EntitySync: Not ready, queueing entity for later');
      this.queueEntityForLaterPlacement(entityData);
      return;
    }

    // Check if entity already exists in the unified entity system
    const existingEntity = this.findEntityById(entityData.id);
    if (existingEntity) {
      Logger.log('EntitySync: Entity already exists, skipping');
      return;
    }

    Logger.log('EntitySync: Creating entity from server data');
    // Use WorldObjects to create entity
    const entity = await this.createEntityFromServerData(entityData);
    if (!entity) {
      console.error('EntitySync: Failed to create entity from server data');
      return;
    }

    Logger.log('EntitySync: Successfully created entity, placing in main stage');
    // Place entity directly on main stage (no chunk dependency)
    try {
      this.placeEntityInMainStage(entity, entityData);
      Logger.log('EntitySync: Entity placed successfully');
    } catch (error) {
      console.error('EntitySync: Failed to place entity, queuing for later:', error);
      // If placement fails, queue for later
      this.queueEntityForLaterPlacement(entityData);
      return;
    }
  }

  /**
   * Actually places an entity on the main stage with global coordinates
   */
  private placeEntityInMainStage(entity: GameObject, entityData: EntityData): void {
    // Ensure entity is not in ghost mode (if it supports ghosting)
    GhostableTrait.setGhostMode(entity, false);

    // Set the entity's transform position to global coordinates
    invariant(TransformTrait.is(entity), "Entities must have a transform trait to set position");
    invariant(ContainerTrait.is(entity), "Entities must have a container trait to be placed");

    const { position } = entity.getTrait('position');
    const { container } = entity.getTrait('container');

    position.position = {
      x: entityData.x,
      y: entityData.y,
      type: "global"
    };

    // Place entity directly on main stage with global coordinates
    container.x = entityData.x;
    container.y = entityData.y;    // Add to entity layer for proper depth sorting
    const layerManager = this.game.worldManager.getLayerManager();
    layerManager.addToLayer(container, 'entity');

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
  public async processQueuedEntities(): Promise<void> {
    if (this.queuedEntities.length === 0) {
      return;
    }

    const remainingQueue: EntityData[] = [];
    
    const entityPromises = this.queuedEntities.map(async (entityData) => {
      try {
        // Try to place the entity again
        await this.handleRemoteEntityPlaced(entityData);
        return { success: true, entityData };
      } catch {
        // Still can't place it, keep it in queue
        return { success: false, entityData };
      }
    });

    const results = await Promise.allSettled(entityPromises);
    
    // Rebuild queue with failed entities
    results.forEach((result) => {
      if (result.status === 'fulfilled' && !result.value.success) {
        remainingQueue.push(result.value.entityData);
      }
    });
    
    this.queuedEntities = remainingQueue;
  }

  /***** ENTITY REMOVAL *****/
  public handleRemoteEntityRemoved(data: { id: string }): void {
    const entity = this.findEntityById(data.id);
    if (entity) {
      // Remove from main entity stage
      if (ContainerTrait.is(entity)) {
        const container = entity.getTrait('container').container;
        if (container.parent) {
          container.parent.removeChild(container);
        }
      }

      this.game.entityManager.removeEntity(entity);
    }
  }

  /***** ENTITY SYNC *****/
  public async syncExistingEntities(entities: EntityData[]): Promise<void> {
    // Clear existing server entities (if any)
    this.clearServerEntities();

    // If not ready yet, queue all entities
    if (!this.isReady) {
      this.queuedEntities.push(...entities);
      return;
    }

    // Add all entities from server
    const entityPromises = entities.map(async (entityData) => {
      await this.handleRemoteEntityPlaced(entityData);
    });
    
    await Promise.allSettled(entityPromises);
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
  }  /**
   * Creates an entity from server data using the WorldObjects system
   */
  private async createEntityFromServerData(entityData: EntityData): Promise<GameObject | null> {
    // Map server entity type to WorldObjects key
    const worldObjectKey = ENTITY_TYPE_MAP[entityData.type as keyof typeof ENTITY_TYPE_MAP];
    if (!worldObjectKey) {
      console.warn(`No WorldObjects mapping found for entity type: ${entityData.type}`);
      return null;
    }

    const factory = WorldObjects[worldObjectKey];
    if (!factory) {
      console.warn(`No factory found for WorldObjects key: ${worldObjectKey}`);
      return null;
    }try {
      // Create entity using the unified factory system      // Use createFromServer since this entity originated from the server
      const entity = factory.createFromServer(this.game, {
        x: entityData.x,
        y: entityData.y
      });

      // Set multiplayer properties for remote entity
      entity.setAsRemoteEntity(entityData.id, entityData.placedBy);
      
      return entity;
    } catch (error) {
      console.error(`Failed to create entity of type ${entityData.type}:`, error);
      return null;
    }
  }
}