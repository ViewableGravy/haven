import { createContext, use } from "react";
import invariant from "tiny-invariant";
import type { GameInterface } from "../../utilities/game/gameInterface";

export const PixiContext = createContext<GameInterface | null>(null);
export const usePixiContext = () => {
  const context = use(PixiContext)
  invariant(context, "Pixi context must be used within a PixiProvider");
  return context;
}