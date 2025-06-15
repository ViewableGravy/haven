/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../objects/base";
import type { NetworkSyncConfig } from "../objects/traits/network";
import type { Game } from "./game/game";
import type { Position } from "./position";

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

/***** UNIFIED FACTORY INTERFACE *****/
export interface UnifiedFactory<T extends GameObject> {
  /** Create a local entity (no server sync) */
  createLocal: (game: Game, opts: FactoryOptions) => T;
  /** Create a networked entity (syncs with server) */
  createNetworked: (game: Game, opts: FactoryOptions) => Promise<T>;
  /** Create entity from server data (no entity creation sync) */
  createFromServer: (game: Game, opts: FactoryOptions) => T;
  /** Convert existing local entity to networked */
  createNetworkedFromLocal: (entity: T, game: Game) => Promise<T>;
}

/***** FACTORY CREATOR *****/
export function createFactory<T extends GameObject>(
  config: FactoryConfig<T>
): UnifiedFactory<T> {
  const { factoryFn, network } = config;

  return {
    /**
     * Create a local entity that is not synced with the server
     * Used for previews, temporary objects, and local-only entities
     */
    createLocal: (game: Game, opts: FactoryOptions): T => {
      const position: Position = {
        x: opts.x,
        y: opts.y,
        type: "global"
      };

      return game.worldManager.createLocalEntity(
        () => factoryFn(game, { ...opts, position }),
        {
          autoPlace: {
            x: opts.x,
            y: opts.y
          }
        }
      );
    },

    /**
     * Create a networked entity that syncs with the server
     * Makes an API request to create the entity on the server
     */
    createNetworked: async (game: Game, opts: FactoryOptions): Promise<T> => {
      const position: Position = {
        x: opts.x,
        y: opts.y,
        type: "global"
      };      return await game.worldManager.createNetworkedEntity({
        factoryFn: () => factoryFn(game, { ...opts, position }),
        syncTraits: network.syncTraits as any,
        network: {
          syncTraits: network.syncTraits,
          syncFrequency: network.syncFrequency ?? 'batched',
          priority: network.priority ?? 'normal',
          persistent: network.persistent ?? true
        },
        autoPlace: {
          x: opts.x,
          y: opts.y
        }
      });
    },    /**
     * Create an entity from server data (no entity creation sync)
     * Used when the server tells the client to create an entity
     */
    createFromServer: (game: Game, opts: FactoryOptions): T => {
      const position: Position = {
        x: opts.x,
        y: opts.y,
        type: "global"
      };

      return game.worldManager.createFromServerEntity({
        factoryFn: () => factoryFn(game, { ...opts, position }),
        syncTraits: network.syncTraits as any,
        network: {
          syncTraits: network.syncTraits,
          syncFrequency: network.syncFrequency ?? 'batched',
          priority: network.priority ?? 'normal',
          persistent: network.persistent ?? true
        },
        autoPlace: {
          x: opts.x,
          y: opts.y
        }
      });
    },

    /**
     * Convert an existing local entity to a networked one
     * Removes the local entity and creates a networked version
     */
    createNetworkedFromLocal: async (entity: T, game: Game): Promise<T> => {
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

      // Create networked entity at the same position
      return await createFactory(config).createNetworked(game, opts);
    }
  };
}
