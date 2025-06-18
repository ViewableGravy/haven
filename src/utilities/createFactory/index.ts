/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import type { Game } from "../game/game";
import { InternalCreateFactory, type FactoryConfig, type FactoryOptions } from "./_index";

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
export function createFactory<T extends GameObject>(config: FactoryConfig<T>): UnifiedFactory<T> {
  const factory = new InternalCreateFactory(config);

  return {
    createLocal: factory.createLocal,
    createNetworked: factory.createNetworked,
    createFromServer: factory.createFromServer,
    createNetworkedFromLocal: factory.createNetworkedFromLocal,
  };
}

/***** RE-EXPORTS *****/
export type { FactoryConfig, FactoryOptions } from "./_index";

