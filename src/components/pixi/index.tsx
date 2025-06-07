import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { Game } from "../../utilities/game/game";
import { PixiContext } from "./context";

/***** TYPE DEFINITIONS *****/
type PixiCanvasProps = {
  children: React.ReactNode;
};

/***** COMPONENT START *****/
export const PixiProvider = React.memo<PixiCanvasProps>(({ children }) => {
  const [game] = useState(new Game());
  const canvasRef = useRef<HTMLDivElement>(null);
  const { isPending, isSuccess,  } = useQuery({
    queryKey: ["game", "initialize"],
    async queryFn() {
      if (canvasRef.current) {
        await game.initialize(canvasRef.current);
      }

      return null;
    }
  });

  /***** RENDER *****/
  return (
    <>
      <div id="game-container" ref={canvasRef}></div>
      <PixiContext value={game}>
        {isPending && <div>Loading...</div>}
        {isSuccess && children}
      </PixiContext>
    </>
  );
});
