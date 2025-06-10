import type { InventoryNamespace } from "../../components/inventory/types";

/***** TYPE DEFINITIONS *****/
export interface BaseItemOptions {
  weight?: number;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  size?: InventoryNamespace.ItemSize;
}

/***** LEGACY COMPATIBILITY *****/

/**
 * @deprecated Use factory functions from ./factory.ts instead
 * This is kept for backward compatibility during migration
 */
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
    console.warn('BaseItem is deprecated. Use factory functions from ./factory.ts instead');
  }

  /***** ABSTRACT METHODS *****/
  abstract use(): void;
  abstract canStackWith(otherItem: InventoryNamespace.Item): boolean;
}
