import type { Store } from "@tanstack/react-store";
import { createStoreAction } from "../../../utilities/store";
import type { InventoryNamespace } from "../types";
import { addItemToGrid, addItemToGridAtSlot, canPlaceItemAtSlot, getItemStackFromSlot, getMainSlotFromAny, getSlotByIndex, moveItemBetweenSlots, removeItemFromGrid } from "./_actions";

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

/***** DRAG AND DROP ACTIONS *****/

export const setHeldItem = createStoreAction<InventoryNamespace.State, [heldItem: InventoryNamespace.HeldItem | null]>((store, heldItem) => {
  store.setState((state) => ({
    ...state,
    heldItem,
  }));
});

export const setHoveredSlot = createStoreAction<InventoryNamespace.State, [slotIndex: number | null]>((store, slotIndex) => {
  store.setState((state) => ({
    ...state,
    hoveredSlot: slotIndex,
  }));
});

export const setCursorPosition = createStoreAction<InventoryNamespace.State, [position: { x: number; y: number }]>((store, position) => {
  store.setState((state) => ({
    ...state,
    cursorPosition: position,
  }));
});

export const pickUpItem = createStoreAction<InventoryNamespace.State, [slotIndex: number, cursorOffset: { x: number; y: number }]>((store, slotIndex, cursorOffset) => {
  const currentGrid = store.state.grid;
  const slot = getSlotByIndex(currentGrid, slotIndex);
  
  if (!slot) {
    return false;
  }
  
  const itemStack = getItemStackFromSlot(currentGrid, slot);
  if (!itemStack) {
    return false;
  }
  
  // Remove the item from the grid
  const result = removeItemFromGrid(currentGrid, slotIndex, itemStack.quantity);
  
  if (result.success && result.removedStack) {
    const heldItem: InventoryNamespace.HeldItem = {
      itemStack: result.removedStack,
      originSlot: slotIndex,
      cursorOffset,
    };
    
    store.setState((state) => ({
      ...state,
      grid: result.grid,
      heldItem,
      selectedSlot: null,
    }));
    
    return true;
  }
  
  return false;
});

export const placeHeldItem = createStoreAction<InventoryNamespace.State, [targetSlot: number]>((store, targetSlot) => {
  const { heldItem, grid: currentGrid } = store.state;
  
  if (!heldItem) {
    return false;
  }
  
  // Check if we can place the item at the target slot
  if (!canPlaceItemAtSlot(currentGrid, heldItem.itemStack.item, targetSlot)) {
    return false;
  }
  
  // Add the item to the grid at the specific target slot
  const result = addItemToGridAtSlot(currentGrid, heldItem.itemStack.item, heldItem.itemStack.quantity, targetSlot);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
      heldItem: null,
      hoveredSlot: null,
    }));
    
    return true;
  }
  
  return false;
});

export const returnHeldItem = createStoreAction<InventoryNamespace.State, []>((store) => {
  const { heldItem, grid: currentGrid } = store.state;
  
  if (!heldItem) {
    return false;
  }
  
  // Try to return to origin slot first
  if (canPlaceItemAtSlot(currentGrid, heldItem.itemStack.item, heldItem.originSlot)) {
    const result = addItemToGrid(currentGrid, heldItem.itemStack.item, heldItem.itemStack.quantity);
    
    if (result.success) {
      store.setState((state) => ({
        ...state,
        grid: result.grid,
        heldItem: null,
        hoveredSlot: null,
      }));
      
      return true;
    }
  }
  
  // If origin slot is not available, try to place anywhere
  const result = addItemToGrid(currentGrid, heldItem.itemStack.item, heldItem.itemStack.quantity);
  
  if (result.success) {
    store.setState((state) => ({
      ...state,
      grid: result.grid,
      heldItem: null,
      hoveredSlot: null,
    }));
    
    return true;
  }
  
  // If we can't place anywhere, keep holding the item
  return false;
});
