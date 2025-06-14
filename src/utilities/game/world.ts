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

  /***** CONVENIENCE METHODS *****/
  /**
   * Create a networked entity that syncs specified traits
   */
  public createNetworkedEntity<T extends GameObject>(opts: CreateNetworkedEntityOpts<T>): T {
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

  /***** ENTITY MANAGEMENT HELPERS *****/
  /**
   * Destroy an entity, ensuring all cleanup happens correctly
   */
  public destroyEntity(entity: GameObject): void {
    // The EntityManager.removeEntity will handle calling destroy callbacks
    // and cleaning up the entity properly
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
  public findEntitiesWithTrait(traitName: string): Array<GameObject> {
    const entities: Array<GameObject> = [];
    
    for (const entity of this.getAllEntities()) {
      try {
        entity.getTrait(traitName as keyof import('../../objects/traits/types').Traits);
        entities.push(entity);
      } catch {
        // Entity doesn't have this trait, skip it
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

  /***** UTILITY METHODS *****/
  /**
   * Get the game instance for advanced operations
   */
  public getGame(): Game {
    return this.game;
  }

  /**
   * Check if multiplayer is available
   */
  public isMultiplayerEnabled(): boolean {
    return this.game.controllers.multiplayer?.isConnected() ?? false;
  }
}
