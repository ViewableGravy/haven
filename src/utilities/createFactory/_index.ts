/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import type { NetworkSyncConfig } from "../../objects/traits/network";
import type { Game } from "../game/game";
import type { Position } from "../position";

/***** FACTORY CONFIGURATION *****/
export interface FactoryConfig<T extends GameObject> {
  /** The base factory function that creates the entity */
  factoryFn: (game: Game, opts: any) => T;
  /** Network synchronization configuration */
  network: NetworkSyncConfig;
}

/***** FACTORY OPTIONS *****/
export interface FactoryOptions {
  x: number;
  y: number; 
  [key: string]: any; // Allow additional options
}

/***** INTERNAL FACTORY CLASS *****/
export class InternalCreateFactory<T extends GameObject> {
  private factoryFn: (game: Game, opts: any) => T;
  private network: NetworkSyncConfig;

  constructor(config: FactoryConfig<T>) {
    this.factoryFn = config.factoryFn;
    this.network = config.network;
  }

  /**
   * Create a local entity that is not synced with the server
   * Used for previews, temporary objects, and local-only entities
   */
  createLocal = (game: Game, opts: FactoryOptions): T => {
    const position: Position = {
      x: opts.x,
      y: opts.y,
      type: "global"
    };

    return game.worldManager.createLocalEntity(
      () => this.factoryFn(game, { ...opts, position }),
      {
        autoPlace: {
          x: opts.x,
          y: opts.y
        }
      }
    );
  };

  /**
   * Create a networked entity that syncs with the server
   * Makes an API request to create the entity on the server
   */
  createNetworked = async (game: Game, opts: FactoryOptions): Promise<T> => {
    const position: Position = {
      x: opts.x,
      y: opts.y,
      type: "global"
    };

    return await game.worldManager.createNetworkedEntity({
      factoryFn: () => this.factoryFn(game, { ...opts, position }),
      syncTraits: this.network.syncTraits as any,
      network: {
        syncTraits: this.network.syncTraits,
        syncFrequency: this.network.syncFrequency ?? 'batched',
        priority: this.network.priority ?? 'normal',
        persistent: this.network.persistent ?? true
      },
      autoPlace: {
        x: opts.x,
        y: opts.y
      }
    });
  };

  /**
   * Create an entity from server data (no entity creation sync)
   * Used when the server tells the client to create an entity
   */
  createFromServer = (game: Game, opts: FactoryOptions): T => {
    const position: Position = {
      x: opts.x,
      y: opts.y,
      type: "global"
    };

    return game.worldManager.createFromServerEntity({
      factoryFn: () => this.factoryFn(game, { ...opts, position }),
      syncTraits: this.network.syncTraits as any,
      network: {
        syncTraits: this.network.syncTraits,
        syncFrequency: this.network.syncFrequency ?? 'batched',
        priority: this.network.priority ?? 'normal',
        persistent: this.network.persistent ?? true
      },
      autoPlace: {
        x: opts.x,
        y: opts.y
      }
    });
  };

  /**
   * Convert an existing local entity to a networked one
   * Removes the local entity and creates a networked version
   */
  createNetworkedFromLocal = async (entity: T, game: Game): Promise<T> => {
    // Get entity position
    const positionTrait = entity.getTrait('position');
    const position = positionTrait.position.position;

    if (position.x === undefined || position.y === undefined) {
      throw new Error('Entity position not set, cannot convert to networked');
    }

    // Extract any additional properties from the entity if needed
    const opts: FactoryOptions = {
      x: position.x,
      y: position.y
    };

    // Remove the local entity
    game.worldManager.destroyEntity(entity);

    // Create networked entity at the same position using internal method
    return await this.createNetworked(game, opts);
  };
}
