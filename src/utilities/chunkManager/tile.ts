import { Sprite, type Texture, type TextureSource } from "pixi.js";
import type { Game } from "../game/game";

type PrimitiveOptions = {
  width?: number;
  height?: number;
  x: number;
  y: number;
  tint: number;
}

export class TileFactory {
  constructor(
    private texture: Texture<TextureSource<any>>,
    private game?: Game
  ) { }

  public createPrimitive = (opts: PrimitiveOptions) => {
    const tileSize = this.game?.consts.tileSize ?? 64;
    
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