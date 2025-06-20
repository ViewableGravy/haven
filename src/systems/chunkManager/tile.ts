/***** TYPE DEFINITIONS *****/
import { Sprite, type Texture, type TextureSource } from "pixi.js";
import { GameConstants } from "../../shared/constants";
import type { Game } from "../../utilities/game/game";

type PrimitiveOptions = {
  width?: number;
  height?: number;
  x: number;
  y: number;
  tint: number;
}

/**
 * Factory for creating tile sprites with consistent properties
 */
export class TileFactory {
  /**
   * Creates a new TileFactory instance
   * @param texture - The base texture to use for all tiles
   * @param game - Optional game instance for accessing tile size constants
   */
  constructor(
    private texture: Texture<TextureSource<any>>,
    private game?: Game
  ) { }

  /**
   * Creates a tile sprite with the specified options
   * @param opts - Configuration options for the tile
   * @param opts.width - Optional width override (defaults to shared constants TILE_SIZE)
   * @param opts.height - Optional height override (defaults to shared constants TILE_SIZE)
   * @param opts.x - X position of the tile
   * @param opts.y - Y position of the tile
   * @param opts.tint - Color tint to apply to the tile
   * @returns A configured PIXI.js Sprite representing the tile
   */
  public createPrimitive = (opts: PrimitiveOptions) => {
    // Use shared constants as default, fallback to game constants if available
    const tileSize = this.game?.consts.tileSize ?? GameConstants.TILE_SIZE;
    
    const tile = Sprite.from(this.texture);
    tile.width = opts.width ?? tileSize;
    tile.height = opts.height ?? tileSize;
    tile.x = opts.x;
    tile.y = opts.y;
    tile.eventMode = "none";
    tile.interactive = false;
    tile.interactiveChildren = false;
    tile.tint = opts.tint;

    return tile;
  }
}