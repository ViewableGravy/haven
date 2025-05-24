import { Assembler } from "../../entities/assembler";
import type { BaseEntity } from "../../entities/base";
import type { Game } from "../game/game";
import { Position } from "../position";

export class ChunkLoader {
  constructor(private game: Game) { }

  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<BaseEntity>> => {
    if (chunkX === 0 && chunkY === 0) {
      return [
        new Assembler(
          this.game,
          new Position(0, 0, "local")
        ),
        new Assembler(
          this.game,
          new Position(this.game.consts.tileSize * 3, this.game.consts.tileSize * 3, "local")
        ),
        new Assembler(
          this.game,
          new Position(this.game.consts.tileSize * 6, this.game.consts.tileSize * 1, "local")
        ),
      ]
    }

    return [];
  }
}