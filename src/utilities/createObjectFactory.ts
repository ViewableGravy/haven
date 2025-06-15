/***** TYPE DEFINITIONS *****/
import type { TraitNames } from "objects/traits/types";
import type { GameObject } from "../objects/base";
import type { Game } from "./game/game";
import type { Position } from "./position";

export interface FactoryOptions {
  x: number;
  y: number;
  game: Game;
}

export interface ObjectFactory<T extends GameObject> {
  createLocal: (options: FactoryOptions) => T;
  createNetworked: (options: FactoryOptions) => Promise<T>;
  createFromServer: (options: FactoryOptions) => T;
  castToNetworked: (entity: T, options: Omit<FactoryOptions, 'x' | 'y'>) => Promise<T>;
}

export type BaseFactoryFunction<T extends GameObject> = (game: Game, position: Position) => T;

/***** OBJECT FACTORY CREATOR *****/
export function createObjectFactory<T extends GameObject>(
  factoryFn: BaseFactoryFunction<T>,
  syncTraits: Array<TraitNames> = ['position', 'placeable']
): ObjectFactory<T> {
  return {
    /**
     * Create a local entity that is not synced with the server
     * Used for visual placement previews, temporary objects, etc.
     */
    createLocal: (options: FactoryOptions): T => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };

      // Use the World manager to create a local entity
      return options.game.worldManager.createLocalEntity(
        () => factoryFn(options.game, position),
        {
          autoPlace: {
            x: options.x,
            y: options.y
          }
        }
      );
    },    
    
    /**
     * Create a networked entity that is synced with the server. Consider this the same as making a POST request to an endpoint.
     * This sends a request to the server and waits for confirmation - note: the returned entity is automatically rendered
     * in the world once the server confirms creation.
     * 
     * The returned entity can be used immediately to apply post creation logic if necessary.
     */
    createNetworked: async (options: FactoryOptions): Promise<T> => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };

      // Create networked entity using World manager
      // The World manager will handle entity creation sync
      return await options.game.worldManager.createNetworkedEntity({
        factoryFn: () => factoryFn(options.game, position),
        syncTraits,
        autoPlace: {
          x: options.x,
          y: options.y
        }
      });
    },

    /**
     * Create an entity from server data (no entity creation sync)
     * Used when the server tells the client to create an entity
     */
    createFromServer: (options: FactoryOptions): T => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };

      // Use the World manager to create a networked entity without entity creation sync
      // This entity originated from the server, so no need to sync creation back
      return options.game.worldManager.createFromServerEntity({
        factoryFn: () => factoryFn(options.game, position),
        syncTraits: syncTraits as any,
        autoPlace: {
          x: options.x,
          y: options.y
        }
      });
    },

    /**
     * Convert an existing local entity to a networked one
     * This removes the local entity and requests the server to create it
     */
    castToNetworked: async (entity: T, options: Omit<FactoryOptions, 'x' | 'y'>): Promise<T> => {
      // Get entity position
      const positionTrait = entity.getTrait('position');
      const position = positionTrait.position.position;

      if (position.x === undefined || position.y === undefined) {
        throw new Error('Entity position not set, cannot cast to networked');
      }

      // Remove the local entity
      options.game.worldManager.destroyEntity(entity);

      // Create networked version at same position
      return createObjectFactory(factoryFn, syncTraits).createNetworked({
        ...options,
        x: position.x,
        y: position.y
      });
    }
  };
}
