import { store } from "../store";

export type PositionType = "global" | "local" | "screenspace";
export type NonNullablePosition = Omit<Position, "type"> & { type: PositionType };

type Args = [number, number] | [number, number, PositionType];

export class Position {
  public x: number
  public y: number
  public type: PositionType

  constructor(x: number, y: number);
  constructor(x: number, y: number, type: PositionType);
  constructor(...args: Args) {
    if (args.length === 2) {
      this.x = args[0];
      this.y = args[1];
      this.type = "global"; // Default type
    } else if (args.length === 3) {
      this.x = args[0];
      this.y = args[1];
      this.type = args[2];
    } else {
      throw new Error("Invalid number of arguments for Position constructor");
    }
  }

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
