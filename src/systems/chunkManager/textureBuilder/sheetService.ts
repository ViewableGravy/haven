import type { Sprite } from "pixi.js";
import type { LoadChunkEvent } from "../../../server/types/events/load_chunk";
import { DesertSprite, type DesertSpriteName } from "../../../spriteSheets/desert/desert";
import { MeadowSprite, type MeadowSpriteName } from "../../../spriteSheets/meadow/meadow";

/***** TYPE DEFINITIONS *****/
export type SpriteNames = MeadowSpriteName | DesertSpriteName;

export interface SpriteSheet {
  normalizedSpriteNames: Record<string, true>;
  createSprite(name: SpriteNames): Sprite;
  castIndexToName: (index: number) => SpriteNames;
  size: number;
}

/***** COMPONENT START *****/
export class ChunkTextureSpriteService {
  public static getSheet = (biome: LoadChunkEvent.Biome): SpriteSheet => {
    switch (biome) {
      case "meadow":
        return ChunkTextureSpriteService.MeadowSheet;
      case "desert":
        return ChunkTextureSpriteService.DesertSheet;
      default:
        throw new Error(`Unknown biome: ${biome}`);
    }
  }

  public static getSheetByName = (name: SpriteNames): SpriteSheet => {
    switch (true) {
      case name in MeadowSprite.normalizedSpriteNames:
        return ChunkTextureSpriteService.MeadowSheet;
      case name in DesertSprite.normalizedSpriteNames:
        return ChunkTextureSpriteService.DesertSheet;
      default:
        throw new Error(`Unknown sprite name: ${name}`);
    }
  }

  private static MeadowSheet: SpriteSheet = {
    normalizedSpriteNames: MeadowSprite.normalizedSpriteNames,
    castIndexToName: MeadowSprite.castIndexToName,
    createSprite: (name: MeadowSpriteName) => MeadowSprite.createSprite(name),
    size: MeadowSprite.size
  }

  private static DesertSheet: SpriteSheet = {
    normalizedSpriteNames: DesertSprite.normalizedSpriteNames,
    castIndexToName: DesertSprite.castIndexToName,
    createSprite: (name: DesertSpriteName) => DesertSprite.createSprite(name),
    size: DesertSprite.size
  }
}