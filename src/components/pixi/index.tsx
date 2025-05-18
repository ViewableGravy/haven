import React, { useState } from "react";
import { Game } from "../../utilities/game/game";

/***** TYPE DEFINITIONS *****/
type PixiCanvas = React.FC;

/***** COMPONENT START *****/
export const PixiCanvas: PixiCanvas = React.memo(() => {
  const [game] = useState(new Game());

  const initializeGame = (instance: HTMLElement | null) => {
    if (instance) {
      game.initialize(instance);
    }
  }

  /***** RENDER *****/
  return <div id="game-container" ref={initializeGame}></div>;
});
