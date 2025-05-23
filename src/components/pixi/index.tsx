import React, { useState } from "react";
import { Game } from "../../utilities/game/game";
import { PixiContext } from "./context";

/***** TYPE DEFINITIONS *****/
type PixiCanvasProps = {
  children: React.ReactNode;
};

/***** COMPONENT START *****/
export const PixiProvider = React.memo<PixiCanvasProps>(({ children }) => {
  const [game] = useState(new Game());

  const initializeGame = (instance: HTMLElement | null) => {
    if (instance) {
      game.initialize(instance);
    }
  }

  /***** RENDER *****/
  return (
    <>
      <div id="game-container" ref={initializeGame}></div>;
      <PixiContext value={game}>
        {children}
      </PixiContext>
    </>
  );
});
