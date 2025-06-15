import { Store } from "@tanstack/react-store";
import type React from "react";
import type { GameObject } from "../../objects/base";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";

/***** TYPE DEFINITIONS *****/

export type HotbarItem = {
  name: string;
  node: React.ReactNode;
  creatorFunction: (game: Game, position: Position) => GameObject;
  previewCreatorFunction?: (game: Game, position: Position) => GameObject;
};

type HotbarStore = {
  items: HotbarItem[];
};

type SelectionStore = {
  selectedIndex: number | null;
  cleanup: (() => void) | null;
};

/***** HOTBAR STORE *****/
// Create a function to get items from the infographics registry
const getHotbarItems = (): HotbarItem[] => {
  const allInfographics = infographicsRegistry.getAll();
  return allInfographics.map(infographic => ({
    name: infographic.name,
    node: infographic.name,
    creatorFunction: infographic.creatorFunction!,
    previewCreatorFunction: infographic.previewCreatorFunction
  }));
};

export const hotbarStore = new Store<HotbarStore>({
  items: getHotbarItems()
});

/***** REFRESH FUNCTION *****/
// Function to refresh hotbar items from the registry
export const refreshHotbarItems = () => {
  hotbarStore.setState(() => ({
    items: getHotbarItems()
  }));
};

/***** SELECTION STORE *****/
export const selectionStore = new Store<SelectionStore>({
  selectedIndex: null,
  cleanup: null
});

/***** SELECTION HELPER FUNCTIONS *****/
export const clearSelection = () => {
  const currentState = selectionStore.state;
  if (currentState.cleanup) {
    currentState.cleanup();
  }
  selectionStore.setState(() => ({
    selectedIndex: null,
    cleanup: null
  }));
};