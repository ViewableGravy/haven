import { type ContainerChild } from "pixi.js";
import { TestEntity } from "../../entities/test";
import { store } from "../store";

const createChildren = (entities: Array<TestEntity>): Array<ContainerChild> => entities.map((entity) => entity.containerChild); 

export class ChunkLoader {
  constructor() { }

  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<ContainerChild>> => {
    if (chunkX === 0 && chunkY === 0) {
      return createChildren([
        new TestEntity({ x: 0, y: 0 }),
        new TestEntity({ x: store.consts.tileSize * 3, y: store.consts.tileSize * 4 }),
        new TestEntity({ x: store.consts.tileSize * 6, y: store.consts.tileSize * 2 })
      ])
    }

    return [];
  }
}