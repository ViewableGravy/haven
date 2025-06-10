/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../../objects/base";
import type { EntityData } from "../../server/types";
import type { Game } from "../game/game";
import type { Position } from "../position";

export interface EntitySyncCreator {
  name: string;
  creatorFunction: (game: Game, position: Position) => GameObject;
}

/***** ENTITY SYNC REGISTRY *****/
export class EntitySyncRegistry {
  private creators: Map<string, EntitySyncCreator> = new Map();

  /***** REGISTRATION *****/
  public register(entityType: string, creator: EntitySyncCreator): void {
    this.creators.set(entityType, creator);
  }

  /***** ENTITY CREATION *****/
  public createEntity(entityData: EntityData, game: Game): GameObject | null {
    const creator = this.creators.get(entityData.type);
    if (!creator) {
      console.warn(`No entity sync creator registered for type: ${entityData.type}`);
      return null;
    }

    try {
      // Create entity at temporary position (will be positioned properly by EntitySyncManager)
      const tempPosition: Position = { x: 0, y: 0, type: "global" as const };
      const entity = creator.creatorFunction(game, tempPosition);
      
      // Set multiplayer properties using BaseEntity methods
      entity.setAsRemoteEntity(entityData.id, entityData.placedBy);
      
      return entity;
    } catch (error) {
      console.error(`Failed to create entity of type ${entityData.type}:`, error);
      return null;
    }
  }

  /***** UTILITIES *****/
  public hasCreator(entityType: string): boolean {
    return this.creators.has(entityType);
  }

  public getRegisteredTypes(): string[] {
    return Array.from(this.creators.keys());
  }

  public clear(): void {
    this.creators.clear();
  }
}

/***** GLOBAL REGISTRY INSTANCE *****/
export const entitySyncRegistry = new EntitySyncRegistry();