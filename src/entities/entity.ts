import type { Graphics } from "pixi.js";


export class Entity {
  static hoveredMap: Record<number, boolean> = {};
  static hoveredGraphicMap: Record<number, Graphics> = {};
}