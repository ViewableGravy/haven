import type { ContainerTrait } from "./container";
import type { GhostableTrait } from './ghostable';
import type { InventoryTrait } from './inventory';
import type { ItemTrait } from './item';
import { PlaceableTrait } from './placeable';
import type { TransformTrait } from "./transform";

export type Traits = {
  container: InstanceType<typeof ContainerTrait>;
  position: InstanceType<typeof TransformTrait>;
  placeable: InstanceType<typeof PlaceableTrait>;
  ghostable: InstanceType<typeof GhostableTrait>;
  inventory: InstanceType<typeof InventoryTrait>;
  item: InstanceType<typeof ItemTrait>;
}

export type TraitNames = keyof Traits;
