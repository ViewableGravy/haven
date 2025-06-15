/***** TYPE DEFINITIONS *****/
import { Container } from 'pixi.js';
import type { GameObject } from "../../objects/base";
import { NetworkTrait, type NetworkSyncConfig } from "../../objects/traits/network";
import type { TraitNames } from "../../objects/traits/types";
import type { LayerManager, LayerType, LayeredEntity } from "../../types/rendering";
import { Logger } from "../logger";
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
  private layerManager: LayerManager | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  /***** LAYER SYSTEM *****/
  /**
   * Initialize the layer system with background and entity layers
   * This is called after the world container is created
   */
  public initializeLayerSystem(): void {
    if (this.layerManager) {
      return; // Already initialized
    }
    
    const backgroundLayer = new Container();
    const entityLayer = new Container();
    
    backgroundLayer.zIndex = -10;
    entityLayer.zIndex = 0;
    
    // Add layers to the world container so they inherit zoom transforms
    this.game.world.addChild(backgroundLayer);
    this.game.world.addChild(entityLayer);
    
    // Enable sorting for the world container and entity layer
    this.game.world.sortableChildren = true;
    entityLayer.sortableChildren = true;
    
    const updateEntitySorting = () => {
      // Sort entities by y-position for proper depth perception
      const entities = entityLayer.children as Array<LayeredEntity>;
      entities.forEach((entity, index) => {
        if (entity._isLayeredEntity) {
          // Use y-position for z-index, with small offset to maintain stable sorting
          entity.zIndex = entity.y + (index * 0.001);
        }
      });
    };
      const addToLayer = (object: Container, layer: LayerType) => {
      const layeredObject = object as LayeredEntity;
      
      // Remove from current layer if any
      if (layeredObject._currentLayer && this.layerManager) {
        this.layerManager.removeFromLayer(object);
      }
      
      // Add to appropriate layer
      if (layer === 'background') {
        backgroundLayer.addChild(object);
      } else {
        layeredObject._isLayeredEntity = true;
        entityLayer.addChild(object);
        updateEntitySorting();
      }
      
      layeredObject._currentLayer = layer;
    };
    
    const removeFromLayer = (object: Container) => {
      const layeredObject = object as LayeredEntity;
      
      if (layeredObject._currentLayer === 'background') {
        backgroundLayer.removeChild(object);
      } else if (layeredObject._currentLayer === 'entity') {
        entityLayer.removeChild(object);
        layeredObject._isLayeredEntity = false;
      }
      
      layeredObject._currentLayer = undefined;
    };
    
    this.layerManager = {
      backgroundLayer,
      entityLayer,
      addToLayer,
      removeFromLayer,
      updateEntitySorting
    };
  }

  /**
   * Get the layer manager for external access
   */
  public getLayerManager(): LayerManager {
    if (!this.layerManager) {
      throw new Error('Layer system not initialized. Call initializeLayerSystem() first.');
    }
    return this.layerManager;
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
    Logger.log(`World: Creating networked entity with options: ${JSON.stringify(opts)}`);
    
    const entity = this.createEntity(opts.factoryFn, {
      ...opts,
      network: {
        syncTraits: opts.syncTraits,
        syncFrequency: opts.network?.syncFrequency ?? 'batched',
        priority: opts.network?.priority ?? 'normal',
        persistent: opts.network?.persistent ?? true
      }
    });

    Logger.log('World: Entity created, syncing to server');
    // Handle entity creation sync (separate from NetworkTrait)
    await this.syncEntityCreationToServer(entity);

    Logger.log('World: Networked entity creation complete');
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

  /***** ENTITY CREATION SYNC *****/
  /**
   * Handle syncing entity creation to server (separate from NetworkTrait)
   */
  private async syncEntityCreationToServer(entity: GameObject): Promise<void> {
    Logger.log('World: Attempting to sync entity creation to server');
    
    // Don't sync if not connected to multiplayer
    if (!this.game.controllers.multiplayer?.isConnected()) {
      console.warn('World: Not connected to multiplayer, skipping entity sync');
      return;
    }

    Logger.log('World: Multiplayer connected, proceeding with entity sync');

    try {
      const positionTrait = entity.getTrait('position');
      const position = positionTrait.position.position;
      
      Logger.log(`World: Entity position: ${JSON.stringify(position)}`);
      
      // Ensure position is valid
      if (position.x === undefined || position.y === undefined) {
        console.warn('World: Entity position not set, skipping server sync');
        return;
      }
      
      const entityType = entity.getEntityType();
      Logger.log(`World: Entity type: ${entityType}`);
      
      // Calculate chunk coordinates
      const chunkX = Math.floor(position.x / this.game.consts.chunkAbsolute);
      const chunkY = Math.floor(position.y / this.game.consts.chunkAbsolute);
      
      Logger.log(`World: Chunk coordinates: ${chunkX}, ${chunkY}`);

      // Use async notification if available, fallback to synchronous
      if (this.game.controllers.multiplayer?.client.sendEntityPlaceAsync) {
        Logger.log('World: Using async entity place');
        try {
          const result = await this.game.controllers.multiplayer.client.sendEntityPlaceAsync(
            entityType,
            position.x,
            position.y,
            chunkX,
            chunkY
          );
          Logger.log(`World: Entity creation sent successfully: ${JSON.stringify(result)}`);
        } catch (error) {
          console.error('World: Failed to create entity on server:', error);
        }
      } else {
        Logger.log('World: Using sync entity place');
        // Fallback to synchronous method
        this.game.controllers.multiplayer?.client.sendEntityPlace?.(
          entityType,
          position.x,
          position.y,
          chunkX,
          chunkY
        );
        Logger.log('World: Sync entity place sent');
      }
    } catch (error) {
      console.warn('World: Failed to sync entity creation to server:', error);
    }
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
