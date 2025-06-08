import { createStoreAction } from "../../../utilities/store";
import type { InventoryNamespace } from "../types";
import { addItemToGrid, getSlotByIndex, moveItemBetweenSlots, removeItemFromGrid } from "./_actions";

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

export const setHoveredSlot = createStoreAction<InventoryNamespace.State, [slotIndex: number | null]>((store, slotIndex) => {
  store.setState((state) => ({
    ...state,
    hoveredSlot: slotIndex,
  }));
});

export const getSlot = createStoreAction<InventoryNamespace.State, [slotIndex: number]>((store, slotIndex) => {
  const currentGrid = store.state.grid;
  return getSlotByIndex(currentGrid, slotIndex);
});
