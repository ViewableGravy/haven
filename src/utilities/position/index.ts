import { store } from "../store";
import type { PositionType } from "./types";


export class Position {
  constructor(
    public x: number,
    public y: number,
    public type: PositionType | undefined = "global"
  ) {}

  public toGlobal = (): Position => {
    switch (this.type) {
      case "screenspace":
        return this;
      case "global":
        return new Position(this.x - store.game.worldOffset.x, this.y - store.game.worldOffset.y, "global");
      case "local":
        throw new Error("Cannot convert local position to global position without context");
      default:
        throw new Error(`Unknown position type: ${this.type}`);
    }
  }
}