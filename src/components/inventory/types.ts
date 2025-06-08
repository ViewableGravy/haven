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

  /***** SLOT TYPES - DISCRIMINATED UNION *****/
  export interface EmptySlot {
    type: 'empty';
  }

  export interface ItemMainSlot {
    type: 'itemMain';
    itemStack: ItemStack;
    hasSecondarySlots: boolean;
    secondarySlotIndices?: Array<number>; // Indices of secondary slots for multi-slot items
  }

  export interface ItemSecondarySlot {
    type: 'itemSecondary';
    mainSlotIndex: number; // Index of the main slot
  }

  export type Slot = EmptySlot | ItemMainSlot | ItemSecondarySlot;

  export type State = {
    isOpen: boolean;
    grid: InventoryNamespace.Grid;
    selectedSlot: number | null;
  }

  // Updated grid types - using 1D array for better performance
  export type Grid = Array<Slot>;
  export type Grid2D = Array<Array<Slot>>; // Legacy type for migration support

  /***** GRID UTILITY FUNCTIONS *****/
  export const GRID_ROWS = 4;
  export const GRID_COLS = 4;

  export function rowColToIndex(row: number, col: number): number {
    return row * GRID_COLS + col;
  }

  export function indexToRowCol(index: number): { row: number; col: number } {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    return { row, col };
  }

  export function isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
  }

  export function isValidIndex(index: number): boolean {
    return index >= 0 && index < GRID_ROWS * GRID_COLS;
  }
}
