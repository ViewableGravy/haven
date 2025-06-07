import type { InventoryNamespace } from "../../components/inventory/types";

/***** TYPE DEFINITIONS *****/
export interface BaseItemOptions {
  weight?: number;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

/***** BASE ITEM CLASS *****/
export abstract class BaseItem implements InventoryNamespace.Item {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly iconPath: string;
  public readonly maxStackSize: number;
  public readonly weight: number;
  public readonly rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";

  constructor(
    id: string,
    name: string,
    description: string,
    iconPath: string,
    maxStackSize: number = 5,
    weight: number = 1,
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" = "common"
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.iconPath = iconPath;
    this.maxStackSize = maxStackSize;
    this.weight = weight;
    this.rarity = rarity;
  }

  /***** ABSTRACT METHODS *****/
  abstract use(): void;
  abstract canStackWith(otherItem: InventoryNamespace.Item): boolean;
}
