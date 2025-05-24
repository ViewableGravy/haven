import type { Ticker } from "pixi.js";
import type { SetOptional } from "type-fest";
import type { KeyboardController } from "../keyboardController";
import { SubscribablePosition } from "../position/subscribable";
import type { Position as RawPosition } from "../position/types";


type PlayerOptions = {
  position: SetOptional<RawPosition, "type">;
  controller: KeyboardController;
}

export class Player {
  private controller: KeyboardController;
  public position: SubscribablePosition;

  constructor(opts: PlayerOptions) {
    this.controller = opts.controller;
    this.position = new SubscribablePosition(
      opts.position.x, 
      opts.position.y,
      opts.position.type
    );
  }

  public handleMovement = (ticker: Ticker) => {
    const speed = 50 * ticker.deltaTime;

    if (this.controller.keys.right.pressed) {
      this.position.x += speed;
    }
    if (this.controller.keys.left.pressed) {
      this.position.x -= speed;
    }
    if (this.controller.keys.up.pressed) {
      this.position.y -= speed;
    }
    if (this.controller.keys.down.pressed) {
      this.position.y += speed;
    }
  }
}
