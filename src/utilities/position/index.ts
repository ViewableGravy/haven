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

  // Note: toGlobal() method removed as it required global store access
  // This transformation should be handled by the Game instance when needed
}
