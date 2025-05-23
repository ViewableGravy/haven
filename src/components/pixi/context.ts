import { createContext, use } from "react";
import invariant from "tiny-invariant";
import type { Game } from "../../utilities/game/game";


export const PixiContext = createContext<Game | null>(null);
export const usePixiContext = () => {
  const context = use(PixiContext)
  invariant(context, "Pixi context must be used within a PixiProvider");
  return context;
}