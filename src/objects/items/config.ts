import type { InventoryNamespace } from "../../components/inventory/types";

/***** TYPE DEFINITIONS *****/
export interface InitialItemConfig {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  maxStackSize?: number;
  weight?: number;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  size?: InventoryNamespace.ItemSize;
}

export interface ItemConfig extends InitialItemConfig {
  weight: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  size: InventoryNamespace.ItemSize;
  maxStackSize: number;
}

/***** CONFIG HELPER FUNCTION *****/
/**
 * Type-safe helper function for creating item configurations
 */
export function createItemConfig(config: InitialItemConfig): InitialItemConfig {
  return {
    maxStackSize: 5,
    weight: 1,
    rarity: "common",
    size: { width: 1, height: 1 }, // Default size
    ...config
  };
}
