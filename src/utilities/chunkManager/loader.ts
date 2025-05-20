import { type ContainerChild } from "pixi.js";
import { TestEntity } from "../../entities/test";
import { store } from "../store";

export const hoveredUids: Array<number> = []

export class ChunkLoader {
  constructor() { }

  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<ContainerChild>> => {
    if (chunkX === 0 && chunkY === 0) {
      return [
        new TestEntity({ x: 0, y: 0 }).child,
        new TestEntity({ x: store.consts.tileSize * 3, y: store.consts.tileSize * 4 }).child,
        new TestEntity({ x: store.consts.tileSize * 6, y: store.consts.tileSize * 2 }).child
      ]
    }

    return [];
  }
}