import type { Graphics } from "pixi.js";

export abstract class Entity {
  static hoveredMap: Record<number, boolean> = {};
  static hoveredGraphicMap: Record<number, Graphics> = {};
}