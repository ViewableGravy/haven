/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import type { Game } from "../game/game";
import type { Position } from "../position";

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
  baseFactory: BaseFactoryFunction<T>,
  _entityType: string
): ObjectFactory<T> {
  return {
    createLocal: (options: FactoryOptions) => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };
      
      const entity = options.game.worldManager.createLocalEntity(
        () => baseFactory(options.game, position),
        {
          autoPlace: {
            x: options.x,
            y: options.y
          }
        }
      );
      
      return entity;
    },

    createNetworked: async (options: FactoryOptions) => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };

      const entity = await options.game.worldManager.createNetworkedEntity({
        factoryFn: () => baseFactory(options.game, position),
        syncTraits: ['position', 'placeable'],
        autoPlace: {
          x: options.x,
          y: options.y
        }
      });
      
      return entity;
    },    createFromServer: (options: FactoryOptions) => {
      const position: Position = {
        x: options.x,
        y: options.y,
        type: "global"
      };
      
      // Create entity with NetworkTrait but without entity creation sync
      // This is for entities that originated from the server
      const entity = options.game.worldManager.createFromServerEntity({
        factoryFn: () => baseFactory(options.game, position),
        syncTraits: ['position', 'placeable'],
        autoPlace: {
          x: options.x,
          y: options.y
        }
      });
      
      return entity;
    },

    castToNetworked: async (entity: T, options: Omit<FactoryOptions, 'x' | 'y'>) => {
      // Get entity's current position
      const positionTrait = entity.getTrait('position');
      const currentPosition = positionTrait.position.position;
      
      if (currentPosition.x === undefined || currentPosition.y === undefined) {
        throw new Error('Entity position is undefined, cannot cast to networked');
      }

      // Remove the local entity from the game
      options.game.worldManager.destroyEntity(entity);

      // Create a new networked entity at the same position
      const position: Position = {
        x: currentPosition.x,
        y: currentPosition.y,
        type: "global"
      };

      const networkedEntity = await options.game.worldManager.createNetworkedEntity({
        factoryFn: () => baseFactory(options.game, position),
        syncTraits: ['position', 'placeable'],
        autoPlace: {
          x: currentPosition.x,
          y: currentPosition.y
        }
      });

      return networkedEntity;
    }
  };
}