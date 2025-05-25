import type { Ticker } from "pixi.js";
import type { SetOptional } from "type-fest";
import type { Game } from "../game/game";
import type { KeyboardController } from "../keyboardController";
import type { Position } from "../position";
import { SubscribablePosition } from "../position/subscribable";


type PlayerOptions = {
  position: SetOptional<Position, "type">;
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

  public handleMovement = (game: Game, ticker: Ticker) => {
    const speed = 10 * ticker.deltaTime / game.state.zoom;

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
