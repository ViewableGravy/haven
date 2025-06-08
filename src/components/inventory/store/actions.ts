import { createStoreAction } from "../../../utilities/store";
import type { InventoryNamespace } from "../types";
import { addItemToGrid, findSlotById, moveItemBetweenSlots, removeItemFromGrid } from "./_actions";

/***** PUBLIC ACTIONS *****/

export const toggleInventory = createStoreAction<InventoryNamespace.State, []>((store) => {
  store.setState((state) => ({
    ...state,
    isOpen: !state.isOpen,
  }));
});

export const setSelectedSlot = createStoreAction<InventoryNamespace.State, [slotId: string | null]>((store, slotId) => {
  store.setState((state) => ({
    ...state,
    selectedSlot: slotId,
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

export const removeItem = createStoreAction<InventoryNamespace.State, [slotId: string, quantity?: number]>((store, slotId, quantity = 1) => {
  const currentGrid = store.state.grid;
  const result = removeItemFromGrid(currentGrid, slotId, quantity);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
    }));
    return result.removedStack;
  }
  return null;
});

export const moveItem = createStoreAction<InventoryNamespace.State, [fromSlotId: string, toSlotId: string]>((store, fromSlotId, toSlotId) => {
  const currentGrid = store.state.grid;
  const result = moveItemBetweenSlots(currentGrid, fromSlotId, toSlotId);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
    }));
    return true;
  }
  return false;
});

export const setHoveredSlot = createStoreAction<InventoryNamespace.State, [slotId: string | null]>((store, slotId) => {
  store.setState((state) => ({
    ...state,
    hoveredSlot: slotId,
  }));
});

export const getSlot = createStoreAction<InventoryNamespace.State, [slotId: string]>((store, slotId) => {
  const currentGrid = store.state.grid;
  return findSlotById(currentGrid, slotId);
});
