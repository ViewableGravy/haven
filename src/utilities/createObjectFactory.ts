/***** TYPE DEFINITIONS *****/
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
  castToNetworked: (entity: T, options: Omit<FactoryOptions, 'x' | 'y'>) => Promise<T>;
}

export type BaseFactoryFunction<T extends GameObject> = (game: Game, position: Position) => T;

/***** OBJECT FACTORY CREATOR *****/
export function createObjectFactory<T extends GameObject>(
  factoryFn: BaseFactoryFunction<T>,
  syncTraits: Array<string> = ['position', 'placeable']
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
     * Create a networked entity that is synced with the server
     * This sends a request to the server and waits for confirmation
     */
    createNetworked: async (options: FactoryOptions): Promise<T> => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };

      // Calculate chunk coordinates for server
      const chunkX = Math.floor(options.x / options.game.consts.chunkAbsolute);
      const chunkY = Math.floor(options.y / options.game.consts.chunkAbsolute);

      // Send async request to server to create the entity
      const entityType = factoryFn(options.game, { x: 0, y: 0, type: "global" }).getEntityType();
      
      try {
        // Request entity creation from server
        await options.game.controllers.multiplayer?.client.sendEntityPlaceAsync?.(
          entityType,
          options.x,
          options.y,
          chunkX,
          chunkY
        );

        // The server will respond and the entity will be created through the normal
        // multiplayer entity sync flow. We don't create the entity locally here,
        // instead we wait for the server to tell us it was created successfully.
        
        // For now, we'll create a temporary local entity and return it
        // In a full implementation, we'd wait for the server response
        return options.game.worldManager.createNetworkedEntity({
          factoryFn: () => factoryFn(options.game, position),
          syncTraits: syncTraits as any,
          autoPlace: {
            x: options.x,
            y: options.y
          }
        });
        
      } catch (error) {
        console.error('Failed to create networked entity:', error);
        throw error;
      }
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
