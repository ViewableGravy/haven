import { createStandardAssembler } from "../../entities/assembler/factory";
import type { BaseEntity } from "../../entities/base";
import type { Game } from "../game/game";
import { Position } from "../position";

/**
 * Loads entities for chunks based on their coordinates
 */
export class ChunkLoader {
  /**
   * Creates a new ChunkLoader instance
   * @param game - The game instance for accessing constants and creating entities
   */
  constructor(private game: Game) { }

  /**
   * Retrieves entities that should be placed in the specified chunk
   * Currently hardcoded to place assemblers only in chunk (0,0)
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Promise resolving to an array of entities for the chunk
   */
  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<BaseEntity>> => {
    console.log(`ChunkLoader.retrieveEntities called for chunk (${chunkX}, ${chunkY})`);

    if (chunkX === 0 && chunkY === 0) {
      console.log('Creating initial assemblers for chunk (0,0)');

      // Using the new factory pattern
      const assembler1 = createStandardAssembler(
        this.game,
        new Position(0, 0, "local")
      );

      const assembler2 = createStandardAssembler(
        this.game,
        new Position(this.game.consts.tileSize * 3, this.game.consts.tileSize * 3, "local")
      );

      const assembler3 = createStandardAssembler(
        this.game,
        new Position(this.game.consts.tileSize * 6, this.game.consts.tileSize * 1, "local")
      );

      console.log('Created 3 initial assemblers:', { assembler1, assembler2, assembler3 });
      return [assembler1, assembler2, assembler3];
    }

    console.log(`No entities for chunk (${chunkX}, ${chunkY})`);
    return [];
  }
}