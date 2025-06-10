import type { InventoryNamespace } from "../../components/inventory/types";
import type { GameObject } from "../base";

/***** TYPE DEFINITIONS *****/
interface ItemTraitData {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  maxStackSize: number;
  weight: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  size?: InventoryNamespace.ItemSize;
}

/***** ITEM TRAIT *****/
export class ItemTrait implements InventoryNamespace.Item {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly iconPath: string;
  public readonly maxStackSize: number;
  public readonly weight: number;
  public readonly rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  public readonly size?: InventoryNamespace.ItemSize;

  constructor(data: ItemTraitData) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.iconPath = data.iconPath;
    this.maxStackSize = data.maxStackSize;
    this.weight = data.weight;
    this.rarity = data.rarity;
    this.size = data.size;
  }

  /***** ITEM FUNCTIONALITY *****/
  public use(): void {
    console.log(`Used item: ${this.name}`);
  }

  public canStackWith(otherItem: InventoryNamespace.Item): boolean {
    return otherItem.id === this.id;
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): boolean {
    try {
      entity.getTrait('item');
      return true;
    } catch {
      return false;
    }
  }

  static getId(entity: GameObject): string | null {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').id;
    }
    return null;
  }

  static getName(entity: GameObject): string | null {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').name;
    }
    return null;
  }

  static getDescription(entity: GameObject): string | null {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').description;
    }
    return null;
  }

  static use(entity: GameObject): void {
    if (ItemTrait.is(entity)) {
      entity.getTrait('item').use();
    }
  }

  static canStackWith(entity1: GameObject, entity2: GameObject): boolean {
    if (ItemTrait.is(entity1) && ItemTrait.is(entity2)) {
      return entity1.getTrait('item').canStackWith(entity2.getTrait('item'));
    }
    return false;
  }

  static getMaxStackSize(entity: GameObject): number {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').maxStackSize;
    }
    return 1;
  }

  static getWeight(entity: GameObject): number {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').weight;
    }
    return 0;
  }

  static getRarity(entity: GameObject): "common" | "uncommon" | "rare" | "epic" | "legendary" {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').rarity;
    }
    return "common";
  }

  static getSize(entity: GameObject): InventoryNamespace.ItemSize | undefined {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').size;
    }
    return undefined;
  }

  static getIconPath(entity: GameObject): string | null {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item').iconPath;
    }
    return null;
  }

  /***** INVENTORY INTEGRATION UTILITIES *****/

  /**
   * Extracts the ItemTrait from a GameObject to use as InventoryNamespace.Item
   */
  static getInventoryItem(entity: GameObject): InventoryNamespace.Item | null {
    if (ItemTrait.is(entity)) {
      return entity.getTrait('item');
    }
    return null;
  }

  /**
   * Creates an ItemStack from a GameObject with ItemTrait
   */
  static createItemStack(entity: GameObject, quantity: number): InventoryNamespace.ItemStack | null {
    const item = ItemTrait.getInventoryItem(entity);
    if (item) {
      return {
        item,
        quantity
      };
    }
    return null;
  }
}
