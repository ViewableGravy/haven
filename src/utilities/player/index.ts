import { Position } from "../position";
import type { Position as RawPosition, SubscribablePosition } from "../position/types";

type PlayerOptions = {
  position: RawPosition;
}

export class Player {
  public position: SubscribablePosition;

  constructor(opts: PlayerOptions) {
    this.position = new Position(
      opts.position.x, 
      opts.position.y
    );
  }
}
