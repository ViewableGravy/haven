import { Assembler } from "../../entities/assembler";
import type { BaseEntity } from "../../entities/base";
import { Position } from "../position";
import { store } from "../store";

export class ChunkLoader {
  constructor() { }

  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<BaseEntity>> => {
    if (chunkX === 0 && chunkY === 0) {
      return [
        new Assembler(
          new Position(0, 0, "local")
        ),
        new Assembler(
          new Position(store.consts.tileSize * 3, store.consts.tileSize * 3, "local")
        ),
        new Assembler(
          new Position(store.consts.tileSize * 6, store.consts.tileSize * 1, "local")
        ),
      ]
    }

    return [];
  }
}