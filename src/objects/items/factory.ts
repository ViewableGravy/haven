import type { InventoryNamespace } from "../../components/inventory/types";
import { GameObject } from "../base";
import { ItemTrait } from "../traits/item";

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

/***** ITEM FACTORY FUNCTIONS *****/

/**
 * Creates a basic item GameObject with ItemTrait
 */
export function createItem(config: ItemConfig): GameObject {
  const item = new GameObject({ name: `${config.id}-item` });
  
  item.addTrait('item', new ItemTrait({
    id: config.id,
    name: config.name,
    description: config.description,
    iconPath: config.iconPath,
    maxStackSize: config.maxStackSize ?? 5,
    weight: config.weight ?? 1,
    rarity: config.rarity ?? "common",
    size: config.size
  }));

  return item;
}

/***** SPECIFIC ITEM FACTORY FUNCTIONS *****/

export function createStickItem(): GameObject {
  return createItem({
    id: "stick",
    name: "Stick",
    description: "A simple wooden stick. Useful for crafting.",
    iconPath: "/assets/stick.png",
    maxStackSize: 10,
    weight: 0.1,
    rarity: "common"
  });
}

export function createTwigItem(): GameObject {
  return createItem({
    id: "twig",
    name: "Twig",
    description: "A small, flexible branch. Perfect for kindling or simple crafts.",
    iconPath: "/assets/twig.svg",
    maxStackSize: 5,
    weight: 0.05,
    rarity: "common"
  });
}

export function createDuckItem(): GameObject {
  return createItem({
    id: "duck",
    name: "Duck",
    description: "A friendly duck companion. Takes up a bit more space but worth it!",
    iconPath: "/assets/duck.svg",
    maxStackSize: 3,
    weight: 2,
    rarity: "uncommon",
    size: { width: 2, height: 1 }
  });
}

export function createFishingRodItem(): GameObject {
  return createItem({
    id: "fishingrod",
    name: "Fishing Rod",
    description: "A long fishing rod that extends vertically in your inventory.",
    iconPath: "/assets/fishingrod.svg",
    maxStackSize: 1,
    weight: 1.5,
    rarity: "uncommon",
    size: { width: 1, height: 3 }
  });
}

export function createLargeBoxItem(): GameObject {
  return createItem({
    id: "largebox",
    name: "Large Box",
    description: "A big wooden box that takes up significant space but can store many things.",
    iconPath: "/assets/largebox.svg",
    maxStackSize: 1,
    weight: 5,
    rarity: "rare",
    size: { width: 3, height: 2 }
  });
}

/***** UTILITY FUNCTIONS *****/

/**
 * Creates an item by ID using the appropriate factory function
 */
export function createItemById(itemId: string): GameObject | null {
  switch (itemId) {
    case "stick":
      return createStickItem();
    case "twig":
      return createTwigItem();
    case "duck":
      return createDuckItem();
    case "fishingrod":
      return createFishingRodItem();
    case "largebox":
      return createLargeBoxItem();
    default:
      console.warn(`Unknown item ID: ${itemId}`);
      return null;
  }
}
