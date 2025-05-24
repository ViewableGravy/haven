import type { BaseEntity } from "../../entities/base";
import { Assembler } from "../../entities/test";
import { store } from "../store";

export class ChunkLoader {
  constructor() { }

  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<BaseEntity>> => {
    if (chunkX === 0 && chunkY === 0) {
      return [
        new Assembler({ x: 0, y: 0 }),
        new Assembler({ x: store.consts.tileSize * 3, y: store.consts.tileSize * 4 }),
        new Assembler({ x: store.consts.tileSize * 6, y: store.consts.tileSize * 2 })
      ]
    }

    return [];
  }
}