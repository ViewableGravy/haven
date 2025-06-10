import type { InventoryNamespace } from "../../components/inventory/types";

/***** TYPE DEFINITIONS *****/
export interface ItemConfig {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  maxStackSize?: number;
  weight?: number;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  size?: InventoryNamespace.ItemSize;
}

/***** CONFIG HELPER FUNCTION *****/
/**
 * Type-safe helper function for creating item configurations
 */
export function createItemConfig(config: ItemConfig): ItemConfig {
  return {
    maxStackSize: 5,
    weight: 1,
    rarity: "common",
    ...config
  };
}
