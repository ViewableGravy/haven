/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import { NetworkTrait, type NetworkSyncConfig } from "../../objects/traits/network";
import type { TraitNames } from "../../objects/traits/types";
import type { Game } from "./game";

/***** ENTITY CREATION OPTIONS *****/
export interface EntityCreationOptions {
  /** Network synchronization configuration (optional - defaults to no sync) */
  network?: NetworkSyncConfig;
  /** Whether to automatically place the entity at a specific location */
  autoPlace?: {
    x: number;
    y: number;
  };
  /** Additional initialization callback */
  onCreated?: (entity: GameObject) => void;
}

export type CreateNetworkedEntityOpts<T extends GameObject> = EntityCreationOptions & {
  factoryFn: () => T;
  syncTraits: Array<TraitNames>;
}

/***** WORLD OBJECT *****/
export class World {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /***** ENTITY CREATION *****/
  /**
   * Create an entity with automatic registration and optional network sync
   * This is the preferred way to create entities
   */
  public createEntity<T extends GameObject>(entityFactory: () => T, options?: EntityCreationOptions): T {
    // Create the entity using the provided factory
    const entity = entityFactory();

    // Always add NetworkTrait - use provided config or sensible defaults
    const networkConfig = options?.network ?? {
      syncTraits: [], // No traits synced by default
      syncFrequency: 'batched',
      priority: 'normal',
      persistent: false
    };
    
    entity.addTrait('network', new NetworkTrait(entity, this.game, networkConfig));

    // Auto-place entity if coordinates provided
    if (options?.autoPlace) {
      const { x, y } = options.autoPlace;
      this.game.entityManager.placeEntity(entity, x, y);
    }

    // Execute any additional initialization
    if (options?.onCreated) {
      options.onCreated(entity);
    }

    return entity;
  }

  /***** CONVENIENCE METHODS *****/  /**
   * Create a networked entity that syncs specified traits
   */
  public async createNetworkedEntity<T extends GameObject>(opts: CreateNetworkedEntityOpts<T>): Promise<T> {
    
    const entity = this.createEntity(opts.factoryFn, {
      ...opts,
      network: {
        syncTraits: opts.syncTraits,
        syncFrequency: opts.network?.syncFrequency ?? 'batched',
        priority: opts.network?.priority ?? 'normal',
        persistent: opts.network?.persistent ?? true
      }
    });
    // Handle entity creation sync (separate from NetworkTrait)
    await this.syncEntityCreationToServer(entity);
    return entity;
  }

  /**
   * Create a local-only entity (no network sync, but still has NetworkTrait for consistency)
   */
  public createLocalEntity<T extends GameObject>(
    entityFactory: () => T,
    options?: Omit<EntityCreationOptions, 'network'>
  ): T {
    return this.createEntity(entityFactory, {
      ...options,
      network: {
        syncTraits: [], // No traits synced for local entities
        syncFrequency: 'batched',
        priority: 'low',
        persistent: false
      }
    });
  }

  /**
   * Create a networked entity from server data (no entity creation sync)
   */
  public createFromServerEntity<T extends GameObject>(opts: CreateNetworkedEntityOpts<T>): T {
    return this.createEntity(opts.factoryFn, {
      ...opts,
      network: {
        syncTraits: opts.syncTraits,
        syncFrequency: opts.network?.syncFrequency ?? 'batched',
        priority: opts.network?.priority ?? 'normal',
        persistent: opts.network?.persistent ?? true
      }
    });
  }

  /***** ENTITY MANAGEMENT HELPERS *****/
  /**
   * Destroy an entity, ensuring all cleanup happens correctly
   */
  public destroyEntity(entity: GameObject): void {
    // The EntityManager.removeEntity will handle calling destroy callbacks
    // and cleaning up the entity properly
    // Now defaults to notifyServer: true which is appropriate for user-initiated deletions
    this.game.entityManager.removeEntity(entity);
  }

  /***** BATCH OPERATIONS *****/
  /**
   * Create multiple entities efficiently
   */
  public createEntities<T extends GameObject>(
    entities: Array<{
      factory: () => T;
      options?: EntityCreationOptions;
    }>
  ): Array<T> {
    return entities.map(({ factory, options }) => this.createEntity(factory, options));
  }

  /***** ENTITY QUERIES *****/
  /**
   * Get all entities in the world
   */
  public getAllEntities(): Set<GameObject> {
    return this.game.entityManager.getEntities();
  }

  /**
   * Get entities in a specific chunk
   */
  public getEntitiesInChunk(chunkKey: string): Set<GameObject> | undefined {
    return this.game.entityManager.getEntitiesForChunk(chunkKey as any);
  }

  /**
   * Find entities with specific traits
   */
  public findEntitiesWithTrait(traitName: TraitNames): Array<GameObject> {
    const entities: Array<GameObject> = [];
    
    for (const entity of this.getAllEntities()) {
      if (entity.hasTrait(traitName)) {
        entities.push(entity);
      }
    }
    
    return entities;
  }

  /**
   * Find networked entities
   */
  public getNetworkedEntities(): Array<GameObject> {
    return this.findEntitiesWithTrait('network');
  }

  /***** ENTITY CREATION SYNC *****/
  /**
   * Handle syncing entity creation to server (separate from NetworkTrait)
   */
  private async syncEntityCreationToServer(entity: GameObject): Promise<void> {
    // Don't sync if not connected to multiplayer
    if (!this.game.controllers.multiplayer?.isConnected()) {
      console.warn('World: Not connected to multiplayer, skipping entity sync');
      return;
    }

    try {
      const positionTrait = entity.getTrait('position');
      const position = positionTrait.position.position;
      
      
      // Ensure position is valid
      if (position.x === undefined || position.y === undefined) {
        console.warn('World: Entity position not set, skipping server sync');
        return;
      }
      
      const entityType = entity.getEntityType();
      // Calculate chunk coordinates
      const chunkX = Math.floor(position.x / this.game.consts.chunkAbsolute);
      const chunkY = Math.floor(position.y / this.game.consts.chunkAbsolute);
      // Use async notification method
      try {
        await this.game.controllers.multiplayer.client.sendEntityPlaceAsync(
          entityType,
          position.x,
          position.y,
          chunkX,
          chunkY
        );
      } catch (error) {
        console.error('World: Failed to create entity on server:', error);
      }
    } catch (error) {
      console.warn('World: Failed to sync entity creation to server:', error);
    }
  }
}
