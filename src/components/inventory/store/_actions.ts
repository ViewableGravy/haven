// filepath: /home/gravy/programming/haven/src/components/inventory/store/_actions.ts
import type { InventoryNamespace } from "../types";

/***** PRIVATE UTILITY FUNCTIONS *****/

export function findSlotById(grid: InventoryNamespace.Grid, slotId: string): InventoryNamespace.Slot | null {
  for (const row of grid) {
    for (const slot of row) {
      if (slot.id === slotId) {
        return slot;
      }
    }
  }
  return null;
}

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
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        const slot = newGrid[row][col];
        if (slot.itemStack && slot.itemStack.item.id === item.id && remainingQuantity > 0) {
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
    }

    // Then, try to place in empty spaces
    if (remainingQuantity > 0) {
      for (let row = 0; row < newGrid.length; row++) {
        for (let col = 0; col < newGrid[row].length; col++) {
          if (remainingQuantity > 0 && canPlaceMultiSlotItem(newGrid, item, row, col)) {
            const addQuantity = Math.min(remainingQuantity, item.maxStackSize);
            const updatedGrid = placeMultiSlotItem(newGrid, item, addQuantity, row, col);
            Object.assign(newGrid, updatedGrid);
            remainingQuantity -= addQuantity;
          }
        }
      }
    }
  } else {
    // Handle single-slot items (existing logic)
    // First, try to stack with existing items
    for (const row of newGrid) {
      for (const slot of row) {
        if (slot.itemStack && slot.itemStack.item.id === item.id) {
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
    }

    // Then, try to fill empty slots
    for (const row of newGrid) {
      for (const slot of row) {
        if (!slot.itemStack && !slot.occupiedBy && remainingQuantity > 0) {
          const addQuantity = Math.min(remainingQuantity, item.maxStackSize);
          slot.itemStack = {
            item,
            quantity: addQuantity,
          };
          remainingQuantity -= addQuantity;
          
          if (remainingQuantity <= 0) {
            return { success: true, grid: newGrid };
          }
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

export function removeItemFromGrid(grid: InventoryNamespace.Grid, slotId: string, quantity: number): {
  success: boolean;
  grid: InventoryNamespace.Grid;
  removedStack: InventoryNamespace.ItemStack | null;
} {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const slot = findSlotById(newGrid, slotId);
  
  if (!slot) {
    return { success: false, grid, removedStack: null };
  }

  // If this slot is occupied by another slot, find the main slot
  if (slot.occupiedBy && !slot.itemStack) {
    const mainSlot = findSlotById(newGrid, slot.occupiedBy);
    if (!mainSlot || !mainSlot.itemStack) {
      return { success: false, grid, removedStack: null };
    }
    // Remove from the main slot
    return removeItemFromGrid(grid, slot.occupiedBy, quantity);
  }

  if (!slot.itemStack) {
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
      const clearedGrid = clearMultiSlotItem(newGrid, slotId);
      Object.assign(newGrid, clearedGrid);
    } else {
      slot.itemStack = null;
    }
  }

  return {
    success: true,
    grid: newGrid,
    removedStack,
  };
}

export function moveItemBetweenSlots(grid: InventoryNamespace.Grid, fromSlotId: string, toSlotId: string): {
  success: boolean;
  grid: InventoryNamespace.Grid;
} {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const fromSlot = findSlotById(newGrid, fromSlotId);
  const toSlot = findSlotById(newGrid, toSlotId);
  
  if (!fromSlot || !toSlot || !fromSlot.itemStack) {
    return { success: false, grid };
  }

  // If target slot is empty, move the entire stack
  if (!toSlot.itemStack) {
    toSlot.itemStack = fromSlot.itemStack;
    fromSlot.itemStack = null;
    return { success: true, grid: newGrid };
  }

  // If target slot has the same item, try to stack
  if (toSlot.itemStack.item.id === fromSlot.itemStack.item.id) {
    const canMove = Math.min(
      fromSlot.itemStack.quantity,
      fromSlot.itemStack.item.maxStackSize - toSlot.itemStack.quantity
    );
    
    if (canMove > 0) {
      toSlot.itemStack.quantity += canMove;
      fromSlot.itemStack.quantity -= canMove;
      
      if (fromSlot.itemStack.quantity <= 0) {
        fromSlot.itemStack = null;
      }
      
      return { success: true, grid: newGrid };
    }
  }

  // If different items, swap them
  const temp = toSlot.itemStack;
  toSlot.itemStack = fromSlot.itemStack;
  fromSlot.itemStack = temp;
  
  return { success: true, grid: newGrid };
}

/***** MULTI-SLOT ITEM UTILITIES *****/

export function getSlotPosition(grid: InventoryNamespace.Grid, slotId: string): { row: number; col: number } | null {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].id === slotId) {
        return { row, col };
      }
    }
  }
  return null;
}

export function canPlaceMultiSlotItem(
  grid: InventoryNamespace.Grid,
  item: InventoryNamespace.Item,
  startRow: number,
  startCol: number
): boolean {
  const size = item.size || { width: 1, height: 1 };
  
  // Check if the item fits within grid bounds
  if (startRow + size.height > grid.length || startCol + size.width > grid[0].length) {
    return false;
  }
  
  // Check if all required slots are empty or occupied by this item type for stacking
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      const slot = grid[r][c];
      if (slot.itemStack || slot.occupiedBy) {
        // Only allow stacking if it's the same item type and the main slot (top-left)
        if (r === startRow && c === startCol && slot.itemStack?.item.id === item.id) {
          continue; // Allow stacking in main slot
        }
        return false;
      }
    }
  }
  
  return true;
}

export function clearMultiSlotItem(grid: InventoryNamespace.Grid, slotId: string): InventoryNamespace.Grid {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const slot = findSlotById(newGrid, slotId);
  
  if (!slot || !slot.itemStack) {
    return newGrid;
  }
  
  const item = slot.itemStack.item;
  const size = item.size || { width: 1, height: 1 };
  const position = getSlotPosition(newGrid, slotId);
  
  if (!position) {
    return newGrid;
  }
  
  // Clear the main slot and all occupied slots
  for (let r = position.row; r < position.row + size.height; r++) {
    for (let c = position.col; c < position.col + size.width; c++) {
      if (r < newGrid.length && c < newGrid[r].length) {
        if (r === position.row && c === position.col) {
          newGrid[r][c].itemStack = null;
        } else {
          delete newGrid[r][c].occupiedBy;
        }
      }
    }
  }
  
  return newGrid;
}

export function placeMultiSlotItem(
  grid: InventoryNamespace.Grid,
  item: InventoryNamespace.Item,
  quantity: number,
  startRow: number,
  startCol: number
): InventoryNamespace.Grid {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const size = item.size || { width: 1, height: 1 };
  
  // Place the item in the main slot (top-left)
  const mainSlot = newGrid[startRow][startCol];
  if (mainSlot.itemStack && mainSlot.itemStack.item.id === item.id) {
    // Stack with existing item
    mainSlot.itemStack.quantity = Math.min(
      mainSlot.itemStack.quantity + quantity,
      item.maxStackSize
    );
  } else {
    // Place new item
    mainSlot.itemStack = { item, quantity };
  }
  
  // Mark other slots as occupied
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      if (r !== startRow || c !== startCol) {
        if (r < newGrid.length && c < newGrid[r].length) {
          newGrid[r][c].occupiedBy = mainSlot.id;
        }
      }
    }
  }
  
  return newGrid;
}