import type { ContainerTrait } from "./container";
import type { ContextMenuTrait } from './contextMenu';
import type { GhostableTrait } from './ghostable';
import type { InventoryTrait } from './inventory';
import type { ItemTrait } from './item';
import { NetworkTrait } from './network';
import { PlaceableTrait } from './placeable';
import type { TransformTrait } from "./transform";

export type Traits = {
  container: InstanceType<typeof ContainerTrait>;
  position: InstanceType<typeof TransformTrait>;
  placeable: InstanceType<typeof PlaceableTrait>;
  ghostable: InstanceType<typeof GhostableTrait>;
  inventory: InstanceType<typeof InventoryTrait>;
  item: InstanceType<typeof ItemTrait>;
  contextMenu: InstanceType<typeof ContextMenuTrait>;
  network: InstanceType<typeof NetworkTrait>;
}

export type TraitNames = keyof Traits;
