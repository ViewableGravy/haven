import { GameObject } from "../base";
import { ItemTrait } from "../traits/item";
import type { ItemConfig } from "./config";
import { itemRegistry } from "./registry";

/***** ITEM FACTORY FUNCTIONS *****/

/**
 * Creates a basic item GameObject with ItemTrait
 */
export function createItem(config: ItemConfig): GameObject {
  const item = new GameObject({ name: `${config.id}-item` });
  
  item.addTrait('item', new ItemTrait(config));

  return item;
}

/***** SPECIFIC ITEM FACTORY FUNCTIONS *****/

export function createStickItem(): GameObject {
  return createItem(itemRegistry.getConfig("stick"));
}

export function createTwigItem(): GameObject {
  return createItem(itemRegistry.getConfig("twig"));
}

export function createDuckItem(): GameObject {
  return createItem(itemRegistry.getConfig("duck"));
}

export function createFishingRodItem(): GameObject {
  return createItem(itemRegistry.getConfig("fishingrod"));
}

export function createLargeBoxItem(): GameObject {
  return createItem(itemRegistry.getConfig("largebox"));
}

/***** UTILITY FUNCTIONS *****/

/**
 * Creates an item by ID using the configuration registry
 */
export function createItemById(itemId: string): GameObject | null {
  return createItem(itemRegistry.getConfig(itemId));
}
