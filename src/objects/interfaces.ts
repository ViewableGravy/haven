import type { ContainerChild } from "pixi.js";
import type { SubscribablePosition } from "../utilities/position/subscribable";
import type { Rectangle } from "../utilities/rectangle";
import type { Size } from "../utilities/size";

/***** TYPE DEFINITIONS *****/
export interface HasContainer {
  container: ContainerChild;
}

export interface HasPosition {
  position: SubscribablePosition;
}

export interface hasSize {
  size: Size
}

export interface HasRectangle {
  rectangle: Rectangle;
}

export interface HasGhostable {
  ghostMode: boolean;
}

/***** FUNCTIONS *****/
export function hasPosition(obj: any): obj is HasPosition {
  return "position" in obj;
}

export function hasContainer(obj: any): obj is HasContainer {
  return "container" in obj;
}

export function hasSize(obj: any): obj is hasSize {
  return "width" in obj && "height" in obj;
}

export function hasRectangle(obj: any): obj is HasRectangle {
  return "rectangle" in obj;
}

export function hasGhostable(obj: any): obj is HasGhostable {
  return "ghostMode" in obj;
}
