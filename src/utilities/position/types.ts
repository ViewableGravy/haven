
export type PositionType = "global" | "screenspace" | "local";

export type Position = {
  type: PositionType;
  x: number;
  y: number;
}
