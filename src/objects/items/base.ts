import type { InventoryNamespace } from "../../components/inventory/types";

/***** TYPE DEFINITIONS *****/
export interface BaseItemOptions {
  weight?: number;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  size?: InventoryNamespace.ItemSize;
}

/***** BASE ITEM CLASS *****/
export abstract class BaseItem implements InventoryNamespace.Item {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly iconPath: string,
    public readonly maxStackSize: number = 5,
    public readonly weight: number = 1,
    public readonly rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" = "common",
    public readonly size?: InventoryNamespace.ItemSize
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.iconPath = iconPath;
    this.maxStackSize = maxStackSize;
    this.weight = weight;
    this.rarity = rarity;
    this.size = size;
  }

  /***** ABSTRACT METHODS *****/
  abstract use(): void;
  abstract canStackWith(otherItem: InventoryNamespace.Item): boolean;
}
