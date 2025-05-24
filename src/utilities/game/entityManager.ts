import type { BaseEntity } from "../../entities/base";
import type { ChunkKey } from "../tagged";

export class EntityManager {
  private entities: Set<BaseEntity> = new Set();
  private entitiesByChunk: Map<ChunkKey, Set<BaseEntity>> = new Map();

  public addEntity(entity: BaseEntity): void {
    this.entities.add(entity);
  }

  public removeEntity(entity: BaseEntity): void {
    this.entities.delete(entity);
  }

  public getEntities(): Set<BaseEntity> {
    return this.entities;
  }

  public setEntitiesForChunk(chunkKey: ChunkKey, entities: Set<BaseEntity>): void {
    this.entitiesByChunk.set(chunkKey, entities);
  }

  public getEntitiesForChunk(chunkKey: ChunkKey): Set<BaseEntity> | undefined {
    return this.entitiesByChunk.get(chunkKey);
  }

  public removeEntitiesForChunk(chunkKey: ChunkKey): void {
    this.entitiesByChunk.delete(chunkKey);
  }

  public clear(): void {
    this.entities.clear();
    this.entitiesByChunk.clear();
  }
}