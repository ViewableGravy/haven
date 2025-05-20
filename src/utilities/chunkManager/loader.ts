import { Graphics, type ContainerChild } from "pixi.js";


export class ChunkLoader {
  constructor() { }

  public retrieveEntities = async (chunkX: number, chunkY: number): Promise<Array<ContainerChild>> => {
    if (chunkX === 1 && chunkY === 1) {
      const graphic = new Graphics()
        .rect(0, 0, 32, 32)
        .fill(0xFFFFFF)

      graphic.interactive = true;
      graphic.strokeStyle = { width: 2 };

      graphic.onmouseover = () => {
        graphic.fill(0xFF0000);
      }

      graphic.onmouseout = () => {
        graphic.stroke(0xFFFFFF);
      }

      return [graphic]
    }

    return [];
  }
}