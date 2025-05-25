import { Store } from "@tanstack/react-store";
import type React from "react";
import type { BaseEntity } from "../../entities/base";
import type { HasContainer, HasGhostable, HasTransform } from "../../entities/interfaces";
import type { PlaceableTrait } from "../../entities/traits/placeable";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";

/***** TYPE DEFINITIONS *****/
export type FollowableEntity = BaseEntity & HasGhostable & HasContainer & HasTransform & PlaceableTrait;

export type HotbarItem = {
  name: string;
  node: React.ReactNode;
  creatorFunction: (game: Game, position: Position) => FollowableEntity;
};

type HotbarStore = {
  items: HotbarItem[];
};

/***** HOTBAR STORE *****/
// Create a function to get items from the infographics registry
const getHotbarItems = (): HotbarItem[] => {
  const allInfographics = infographicsRegistry.getAll();
  return allInfographics.map(infographic => ({
    name: infographic.name,
    node: infographic.name,
    creatorFunction: infographic.creatorFunction!
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