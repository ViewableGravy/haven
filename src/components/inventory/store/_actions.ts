import { InventoryNamespace } from "../types";

/***** PRIVATE UTILITY FUNCTIONS *****/
// These functions are used internally within the store and should not be called directly from outside

function getSlotPosition(index: number): { row: number; col: number } | null {
  if (index === -1) return null;
  return InventoryNamespace.indexToRowCol(index);
}

function canPlaceMultiSlotItem(
  grid: InventoryNamespace.Grid,
  item: InventoryNamespace.Item,
  startRow: number,
  startCol: number
): boolean {
  const size = item.size || { width: 1, height: 1 };
  
  // Check if the item fits within grid bounds
  if (startRow + size.height > InventoryNamespace.GRID_ROWS || 
      startCol + size.width > InventoryNamespace.GRID_COLS) {
    return false;
  }
  
  // Check if all required slots are empty or occupied by this item type for stacking
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      const index = InventoryNamespace.rowColToIndex(r, c);
      const slot = grid[index];
      if (!isSlotEmpty(slot)) {
        // Only allow stacking if it's the same item type and it's a main slot (top-left)
        if (r === startRow && c === startCol && isMainSlot(slot) && slot.itemStack.item.id === item.id) {
          continue; // Allow stacking in main slot
        }
        return false;
      }
    }
  }
  
  return true;
}

function clearMultiSlotItem(grid: InventoryNamespace.Grid, slotIndex: number): InventoryNamespace.Grid {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const slot = getSlotByIndex(newGrid, slotIndex);
  
  if (!slot || !isMainSlot(slot)) {
    return newGrid;
  }
  
  const item = slot.itemStack.item;
  const size = item.size || { width: 1, height: 1 };
  const position = getSlotPosition(slotIndex);
  
  if (!position) {
    return newGrid;
  }
  
  // Clear the main slot and all secondary slots
  for (let r = position.row; r < position.row + size.height; r++) {
    for (let c = position.col; c < position.col + size.width; c++) {
      if (InventoryNamespace.isValidPosition(r, c)) {
        const index = InventoryNamespace.rowColToIndex(r, c);
        // Convert all slots back to empty slots
        const emptySlot: InventoryNamespace.EmptySlot = {
          type: 'empty'
        };
        newGrid[index] = emptySlot;
      }
    }
  }
  
  return newGrid;
}

function placeMultiSlotItem(
  grid: InventoryNamespace.Grid,
  item: InventoryNamespace.Item,
  quantity: number,
  startRow: number,
  startCol: number
): InventoryNamespace.Grid {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const size = item.size || { width: 1, height: 1 };
  
  // Create secondary slot indices
  const secondarySlotIndices: Array<number> = [];
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      if (r !== startRow || c !== startCol) {
        secondarySlotIndices.push(InventoryNamespace.rowColToIndex(r, c));
      }
    }
  }
  
  // Create or update the main slot (top-left)
  const mainIndex = InventoryNamespace.rowColToIndex(startRow, startCol);
  const currentMainSlot = newGrid[mainIndex];
  
  if (isMainSlot(currentMainSlot) && currentMainSlot.itemStack.item.id === item.id) {
    // Stack with existing item
    currentMainSlot.itemStack.quantity = Math.min(
      currentMainSlot.itemStack.quantity + quantity,
      item.maxStackSize
    );
  } else {
    // Create new main slot
    const mainSlot: InventoryNamespace.ItemMainSlot = {
      type: 'itemMain',
      itemStack: { item, quantity },
      hasSecondarySlots: secondarySlotIndices.length > 0,
      secondarySlotIndices: secondarySlotIndices.length > 0 ? secondarySlotIndices : undefined
    };
    newGrid[mainIndex] = mainSlot;
  }
  
  // Create secondary slots for multi-slot items
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      if ((r !== startRow || c !== startCol) && InventoryNamespace.isValidPosition(r, c)) {
        const secondaryIndex = InventoryNamespace.rowColToIndex(r, c);
        const secondarySlot: InventoryNamespace.ItemSecondarySlot = {
          type: 'itemSecondary',
          mainSlotIndex: mainIndex
        };
        newGrid[secondaryIndex] = secondarySlot;
      }
    }
  }
  
  return newGrid;
}

/***** EXPORTED UTILITY FUNCTIONS *****/
// These functions are exported for use by components and other parts of the store

export function getSlotByIndex(grid: InventoryNamespace.Grid, index: number): InventoryNamespace.Slot | null {
  if (index >= 0 && index < grid.length) {
    return grid[index];
  }
  return null;
}

export function getMainSlotFromAny(grid: InventoryNamespace.Grid, slot: InventoryNamespace.Slot): InventoryNamespace.ItemMainSlot | null {
  if (slot.type === 'itemMain') {
    return slot;
  }
  if (slot.type === 'itemSecondary') {
    const mainSlot = grid[slot.mainSlotIndex];
    return mainSlot?.type === 'itemMain' ? mainSlot : null;
  }
  return null;
}

export function getItemStackFromSlot(grid: InventoryNamespace.Grid, slot: InventoryNamespace.Slot): InventoryNamespace.ItemStack | null {
  const mainSlot = getMainSlotFromAny(grid, slot);
  return mainSlot?.itemStack || null;
}

export function isSlotEmpty(slot: InventoryNamespace.Slot): slot is InventoryNamespace.EmptySlot {
  return slot.type === 'empty';
}

export function isMainSlot(slot: InventoryNamespace.Slot): slot is InventoryNamespace.ItemMainSlot {
  return slot.type === 'itemMain';
}

export function isSecondarySlot(slot: InventoryNamespace.Slot): slot is InventoryNamespace.ItemSecondarySlot {
  return slot.type === 'itemSecondary';
}

/***** PUBLIC STORE ACTIONS *****/
// These functions are the main operations used by the store actions

/**
 * Adds an item to the inventory grid, handling both single-slot and multi-slot items
 * @param grid - The current inventory grid
 * @param item - The item to add
 * @param quantity - The quantity to add
 * @returns Object with success status and updated grid
 */
export function addItemToGrid(grid: InventoryNamespace.Grid, item: InventoryNamespace.Item, quantity: number): {
  success: boolean;
  grid: InventoryNamespace.Grid;
} {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  let remainingQuantity = quantity;
  const isMultiSlot = item.size && (item.size.width > 1 || item.size.height > 1);

  if (isMultiSlot) {
    // Handle multi-slot items
    // First, try to stack with existing items of the same type
    for (let index = 0; index < newGrid.length; index++) {
      const slot = newGrid[index];
      if (isMainSlot(slot) && slot.itemStack.item.id === item.id && remainingQuantity > 0) {
        const canAdd = Math.min(
          remainingQuantity,
          item.maxStackSize - slot.itemStack.quantity
        );
        if (canAdd > 0) {
          slot.itemStack.quantity += canAdd;
          remainingQuantity -= canAdd;
        }
      }
    }

    // Then, try to place in empty spaces
    if (remainingQuantity > 0) {
      for (let index = 0; index < newGrid.length; index++) {
        const { row, col } = InventoryNamespace.indexToRowCol(index);
        if (remainingQuantity > 0 && canPlaceMultiSlotItem(newGrid, item, row, col)) {
          const addQuantity = Math.min(remainingQuantity, item.maxStackSize);
          const updatedGrid = placeMultiSlotItem(newGrid, item, addQuantity, row, col);
          Object.assign(newGrid, updatedGrid);
          remainingQuantity -= addQuantity;
        }
      }
    }
  } else {
    // Handle single-slot items
    // First, try to stack with existing items
    for (const slot of newGrid) {
      if (isMainSlot(slot) && slot.itemStack.item.id === item.id) {
        const canAdd = Math.min(
          remainingQuantity,
          item.maxStackSize - slot.itemStack.quantity
        );
        slot.itemStack.quantity += canAdd;
        remainingQuantity -= canAdd;
        
        if (remainingQuantity <= 0) {
          return { success: true, grid: newGrid };
        }
      }
    }

    // Then, try to fill empty slots
    for (let index = 0; index < newGrid.length; index++) {
      const slot = newGrid[index];
      if (isSlotEmpty(slot) && remainingQuantity > 0) {
        const addQuantity = Math.min(remainingQuantity, item.maxStackSize);
        
        // Convert empty slot to item main slot
        const mainSlot: InventoryNamespace.ItemMainSlot = {
          type: 'itemMain',
          itemStack: {
            item,
            quantity: addQuantity,
          },
          hasSecondarySlots: false
        };
        // Replace the slot in the grid
        newGrid[index] = mainSlot;
        
        remainingQuantity -= addQuantity;
        
        if (remainingQuantity <= 0) {
          return { success: true, grid: newGrid };
        }
      }
    }
  }

  // If we couldn't add all items, return partial success if any were added
  return {
    success: remainingQuantity < quantity,
    grid: newGrid,
  };
}

/**
 * Removes an item from the inventory grid at the specified slot index
 * @param grid - The current inventory grid
 * @param slotIndex - The index of the slot to remove from
 * @param quantity - The quantity to remove
 * @returns Object with success status, updated grid, and removed item stack
 */
export function removeItemFromGrid(grid: InventoryNamespace.Grid, slotIndex: number, quantity: number): {
  success: boolean;
  grid: InventoryNamespace.Grid;
  removedStack: InventoryNamespace.ItemStack | null;
} {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const slot = getSlotByIndex(newGrid, slotIndex);
  
  if (!slot) {
    return { success: false, grid, removedStack: null };
  }

  // If this slot is a secondary slot, find the main slot
  if (isSecondarySlot(slot)) {
    const mainSlotIndex = slot.mainSlotIndex;
    const mainSlot = getSlotByIndex(newGrid, mainSlotIndex);
    if (!mainSlot || !isMainSlot(mainSlot)) {
      return { success: false, grid, removedStack: null };
    }
    // Remove from the main slot
    return removeItemFromGrid(grid, mainSlotIndex, quantity);
  }

  if (!isMainSlot(slot)) {
    return { success: false, grid, removedStack: null };
  }

  const removeQuantity = Math.min(quantity, slot.itemStack.quantity);
  const removedStack: InventoryNamespace.ItemStack = {
    item: slot.itemStack.item,
    quantity: removeQuantity,
  };

  slot.itemStack.quantity -= removeQuantity;
  
  if (slot.itemStack.quantity <= 0) {
    // If removing a multi-slot item entirely, clear all occupied slots
    const item = slot.itemStack.item;
    const isMultiSlot = item.size && (item.size.width > 1 || item.size.height > 1);
    
    if (isMultiSlot) {
      const clearedGrid = clearMultiSlotItem(newGrid, slotIndex);
      Object.assign(newGrid, clearedGrid);
    } else {
      // Convert main slot back to empty slot
      const emptySlot: InventoryNamespace.EmptySlot = {
        type: 'empty'
      };
      // Replace the slot in the grid
      newGrid[slotIndex] = emptySlot;
    }
  }

  return {
    success: true,
    grid: newGrid,
    removedStack,
  };
}

/**
 * Moves an item from one slot to another in the inventory grid
 * @param grid - The current inventory grid
 * @param fromSlotIndex - The index of the source slot
 * @param toSlotIndex - The index of the destination slot
 * @returns Object with success status and updated grid
 */
export function moveItemBetweenSlots(grid: InventoryNamespace.Grid, fromSlotIndex: number, toSlotIndex: number): {
  success: boolean;
  grid: InventoryNamespace.Grid;
} {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const fromSlot = getSlotByIndex(newGrid, fromSlotIndex);
  const toSlot = getSlotByIndex(newGrid, toSlotIndex);
  
  if (!fromSlot || !toSlot || !isMainSlot(fromSlot)) {
    return { success: false, grid };
  }

  // If target slot is empty, move the entire stack
  if (isSlotEmpty(toSlot)) {
    // Create new main slot with the item
    const newMainSlot: InventoryNamespace.ItemMainSlot = {
      type: 'itemMain',
      itemStack: fromSlot.itemStack,
      hasSecondarySlots: fromSlot.hasSecondarySlots,
      secondarySlotIndices: fromSlot.secondarySlotIndices
    };
    
    // Convert from slot back to empty
    const emptySlot: InventoryNamespace.EmptySlot = {
      type: 'empty'
    };
    
    // Replace slots in grid
    newGrid[fromSlotIndex] = emptySlot;
    newGrid[toSlotIndex] = newMainSlot;
    
    return { success: true, grid: newGrid };
  }

  // If target slot has the same item, try to stack
  if (isMainSlot(toSlot) && toSlot.itemStack.item.id === fromSlot.itemStack.item.id) {
    const canMove = Math.min(
      fromSlot.itemStack.quantity,
      fromSlot.itemStack.item.maxStackSize - toSlot.itemStack.quantity
    );
    
    if (canMove > 0) {
      toSlot.itemStack.quantity += canMove;
      fromSlot.itemStack.quantity -= canMove;
      
      if (fromSlot.itemStack.quantity <= 0) {
        // Convert from slot back to empty
        const emptySlot: InventoryNamespace.EmptySlot = {
          type: 'empty'
        };
        newGrid[fromSlotIndex] = emptySlot;
      }
      
      return { success: true, grid: newGrid };
    }
  }

  // If different items and target has an item, swap them
  if (isMainSlot(toSlot)) {
    const tempItemStack = toSlot.itemStack;
    const tempHasSecondary = toSlot.hasSecondarySlots;
    const tempSecondaryIndices = toSlot.secondarySlotIndices;
    
    toSlot.itemStack = fromSlot.itemStack;
    toSlot.hasSecondarySlots = fromSlot.hasSecondarySlots;
    toSlot.secondarySlotIndices = fromSlot.secondarySlotIndices;
    
    fromSlot.itemStack = tempItemStack;
    fromSlot.hasSecondarySlots = tempHasSecondary;
    fromSlot.secondarySlotIndices = tempSecondaryIndices;
  }
  
  return { success: true, grid: newGrid };
}