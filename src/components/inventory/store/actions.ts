import type { Store } from "@tanstack/react-store";
import { createStoreAction } from "../../../utilities/store";
import type { InventoryNamespace } from "../types";
import { addItemToGrid, getItemStackFromSlot, getMainSlotFromAny, getSlotByIndex, moveItemBetweenSlots, removeItemFromGrid } from "./_actions";

/***** PUBLIC ACTIONS *****/

export const toggleInventory = createStoreAction<InventoryNamespace.State, []>((store) => {
  store.setState((state) => ({
    ...state,
    isOpen: !state.isOpen,
  }));
});

export const setSelectedSlot = createStoreAction<InventoryNamespace.State, [slotIndex: number | null]>((store, slotIndex) => {
  store.setState((state) => ({
    ...state,
    selectedSlot: slotIndex,
  }));
});

export const addItem = createStoreAction<InventoryNamespace.State, [item: InventoryNamespace.Item, quantity: number]>((store, item, quantity) => {
  const currentGrid = store.state.grid;
  const result = addItemToGrid(currentGrid, item, quantity);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
    }));
    return true;
  }
  return false;
});

export const removeItem = createStoreAction<InventoryNamespace.State, [slotIndex: number, quantity?: number]>((store, slotIndex, quantity = 1) => {
  const currentGrid = store.state.grid;
  const result = removeItemFromGrid(currentGrid, slotIndex, quantity);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
    }));
    return result.removedStack;
  }
  return null;
});

export const moveItem = createStoreAction<InventoryNamespace.State, [fromSlotIndex: number, toSlotIndex: number]>((store, fromSlotIndex, toSlotIndex) => {
  const currentGrid = store.state.grid;
  const result = moveItemBetweenSlots(currentGrid, fromSlotIndex, toSlotIndex);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
    }));
    return true;
  }
  return false;
});

/**
 * Gets a slot by its index in the inventory grid
 * @param slotIndex - The index of the slot to retrieve
 * @returns The slot at the given index, or null if invalid
 */
export const getSlot = createStoreAction((store: Store<InventoryNamespace.State>, slotIndex: number) => {
  const currentGrid = store.state.grid;
  return getSlotByIndex(currentGrid, slotIndex);
});

/**
 * Gets the main slot from any slot (handles both main and secondary slots)
 * @param slot - The slot to get the main slot from
 * @returns The main slot, or null if not found
 */
export const getMainSlot = createStoreAction((store: Store<InventoryNamespace.State>, slot: InventoryNamespace.Slot) => {
  const currentGrid = store.state.grid;
  return getMainSlotFromAny(currentGrid, slot);
});

/**
 * Gets the item stack from any slot (handles both main and secondary slots)
 * @param slot - The slot to get the item stack from
 * @returns The item stack, or null if no item
 */
export const getItemStack = createStoreAction((store: Store<InventoryNamespace.State>, slot: InventoryNamespace.Slot) => {
  const currentGrid = store.state.grid;
  return getItemStackFromSlot(currentGrid, slot);
});

export const setPosition = createStoreAction<InventoryNamespace.State, [position: { x: number; y: number }]>((store, position) => {
  store.setState((state) => ({
    ...state,
    position,
  }));
});
