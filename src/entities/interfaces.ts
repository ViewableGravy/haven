import type { ContainerChild } from "pixi.js";
import type { SubscribablePosition } from "../utilities/position/types";

/***** TYPE DEFINITIONS *****/
export interface HasContainer {
  container: ContainerChild;
}

export interface HasPosition {
  position: SubscribablePosition;
}

/***** FUNCTIONS *****/
export function hasPosition(obj: any): obj is HasPosition {
  return "position" in obj;
}

export function hasContainer(obj: any): obj is HasContainer {
  return "container" in obj;
}