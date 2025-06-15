/***** TYPE DEFINITIONS *****/
import type React from "react";
import invariant from "tiny-invariant";
import type { Game } from "../game/game";
import type { Position } from "../position";

export type InfographicDefinition = {
  name: string;
  component: React.FC;
  creatorFunction?: (game: Game, position: Position) => any;
  previewCreatorFunction?: (game: Game, position: Position) => any;
};

type InfographicFactory<TEntity = any> = (entity: TEntity) => InfographicDefinition;
type InfographicRegistry = Record<string, InfographicFactory>;

/***** INFOGRAPHICS REGISTRY *****/
class InfographicsRegistry {
  private registry: InfographicRegistry = {};

  /**
   * Register an infographic factory for a specific entity type
   */
  public register<TEntity>(entityType: string, factory: InfographicFactory<TEntity>): void {
    this.registry[entityType] = factory;
  }

  /**
   * Get an infographic definition by entity type and create it with entity instance
   */
  public get<TEntity>(entityType: string, entity: TEntity): InfographicDefinition {
    const factory = this.registry[entityType];
    invariant(factory, `Infographic factory for entity type "${entityType}" is not registered.`);

    return factory(entity);
  }

  /**
   * Check if an infographic is registered for an entity type
   */
  public has(entityType: string): boolean {
    return entityType in this.registry;
  }

  /**
   * Get all registered infographic factories (for hotbar - gets first available creator function)
   */
  public getAll(): InfographicDefinition[] {
    return Object.values(this.registry)
      .map(factory => factory({} as any)) // Temporary entity for getting creator functions
      .filter(def => def.creatorFunction); // Only include items that can be created
  }
}

/***** SINGLETON INSTANCE *****/
export const infographicsRegistry = new InfographicsRegistry();