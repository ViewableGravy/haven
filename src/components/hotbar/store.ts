import { Store } from "@tanstack/react-store";
import type React from "react";
import type { BaseEntity } from "../../entities/base";
import { ContainerTrait } from "../../entities/traits/container";
import { GhostableTrait } from "../../entities/traits/ghostable";
import { PlaceableTrait } from "../../entities/traits/placeable";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import type { HasTransformTrait } from "../../utilities/transform";

/***** TYPE DEFINITIONS *****/
interface HasContainerTrait {
  containerTrait: ContainerTrait;
}

interface HasGhostableTrait {
  ghostableTrait: GhostableTrait;
}

interface HasPlaceableTrait {
  placeableTrait: PlaceableTrait;
}

export type FollowableEntity = BaseEntity & HasGhostableTrait & HasContainerTrait & HasTransformTrait & HasPlaceableTrait;

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