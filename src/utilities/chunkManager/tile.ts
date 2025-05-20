import { Sprite, type Texture, type TextureSource } from "pixi.js";

type PrimitiveOptions = {
  width: number;
  height: number;
  x: number;
  y: number;
  tint: number;
}

export class TileFactory {
  constructor(
    private texture: Texture<TextureSource<any>>,
  ) { }

  public createPrimitive = (opts: PrimitiveOptions) => {
    const tile = Sprite.from(this.texture);
    tile.width = opts.width;
    tile.height = opts.height;
    tile.x = opts.x;
    tile.y = opts.y;
    tile.eventMode = "none";
    tile.interactive = false;
    tile.interactiveChildren = false;
    tile.tint = opts.tint;

    return tile;
  }
}