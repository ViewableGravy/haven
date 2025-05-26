/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../entities/base";
import type { EntityData } from "../../server/types";
import type { Game } from "../game/game";
import type { Position } from "../position";

export interface EntitySyncCreator {
  name: string;
  creatorFunction: (game: Game, position: Position) => BaseEntity;
}

/***** ENTITY SYNC REGISTRY *****/
export class EntitySyncRegistry {
  private creators: Map<string, EntitySyncCreator> = new Map();

  /***** REGISTRATION *****/
  public register(entityType: string, creator: EntitySyncCreator): void {
    this.creators.set(entityType, creator);
  }

  /***** ENTITY CREATION *****/
  public createEntity(entityData: EntityData, game: Game): BaseEntity | null {
    const creator = this.creators.get(entityData.type);
    if (!creator) {
      console.warn(`No entity sync creator registered for type: ${entityData.type}`);
      return null;
    }

    try {
      // Create entity at temporary position (will be positioned properly by EntitySyncManager)
      const tempPosition = { x: 0, y: 0, type: "local" as const };
      const entity = creator.creatorFunction(game, tempPosition);
      
      // Add multiplayer tracking
      (entity as any).multiplayerId = entityData.id;
      (entity as any).placedBy = entityData.placedBy;
      
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