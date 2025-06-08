/***** TYPE DEFINITIONS *****/
export namespace InventoryNamespace {
  export interface ItemSize {
    width: number;
    height: number;
  }

  export interface Item {
    id: string;
    name: string;
    description: string;
    iconPath: string;
    maxStackSize: number;
    size?: ItemSize; // Optional size for multi-slot items
  }

  export interface ItemStack {
    item: Item;
    quantity: number;
  }

  export interface Slot {
    id: string;
    itemStack: ItemStack | null;
    occupiedBy?: string; // Reference to the slot ID that contains the actual item (for multi-slot items)
  }

  export type State = {
    isOpen: boolean;
    grid: InventoryNamespace.Grid;
    selectedSlot: string | null;
    hoveredSlot: string | null;
  }

  export type Grid = Array<Array<Slot>>;
}
