import type { ContainerTrait } from "./container";
import type { GhostableTrait } from './ghostable';
import type { InventoryTrait } from './inventory';
import { PlaceableTrait } from './placeable';
import type { TransformTrait } from "./transform";

export type TraitMap = {
  container: typeof ContainerTrait;
  position: typeof TransformTrait;
  placeable: typeof PlaceableTrait;
  ghostable: typeof GhostableTrait;
  inventory: typeof InventoryTrait;
}

export type TraitNames = keyof TraitMap;

export type Traits = {
  [K in TraitNames]?: InstanceType<TraitMap[K]>;
}