/***** TYPE DEFINITIONS *****/
export namespace InventoryNamespace {
  export interface Item {
    id: string;
    name: string;
    description: string;
    iconPath: string;
    maxStackSize: number;
  }

  export interface ItemStack {
    item: Item;
    quantity: number;
  }

  export interface Slot {
    id: string;
    itemStack: ItemStack | null;
  }

  export type State = {
    isOpen: boolean;
    grid: InventoryNamespace.Grid;
    selectedSlot: string | null;
  }

  export type Grid = Array<Array<Slot>>;
}
