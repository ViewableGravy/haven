// filepath: /home/gravy/programming/haven/src/components/inventory/store/_actions.ts
import { InventoryNamespace } from "../types";

/***** PRIVATE UTILITY FUNCTIONS *****/

export function findSlotById(grid: InventoryNamespace.Grid, slotId: string): InventoryNamespace.Slot | null {
  for (const slot of grid) {
    if (slot.id === slotId) {
      return slot;
    }
  }
  return null;
}

export function findSlotIndex(grid: InventoryNamespace.Grid, slotId: string): number {
  return grid.findIndex((slot) => slot.id === slotId);
}

/***** HELPER FUNCTIONS FOR DISCRIMINATED UNION *****/

export function getMainSlotFromAny(grid: InventoryNamespace.Grid, slot: InventoryNamespace.Slot): InventoryNamespace.ItemMainSlot | null {
  if (slot.type === 'itemMain') {
    return slot;
  }
  if (slot.type === 'itemSecondary') {
    const mainSlot = findSlotById(grid, slot.mainSlotId);
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
    }

    // Then, try to fill empty slots
    for (const row of newGrid) {
      for (const slot of row) {
        if (isSlotEmpty(slot) && remainingQuantity > 0) {
          const addQuantity = Math.min(remainingQuantity, item.maxStackSize);
          // Convert empty slot to item main slot
          const mainSlot: InventoryNamespace.ItemMainSlot = {
            type: 'itemMain',
            id: slot.id,
            itemStack: {
              item,
              quantity: addQuantity,
            },
            hasSecondarySlots: false
          };
          // Replace the slot in the grid
          const rowIndex = newGrid.findIndex((r) => r.includes(slot));
          const colIndex = newGrid[rowIndex].indexOf(slot);
          newGrid[rowIndex][colIndex] = mainSlot;
          
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

  // If this slot is a secondary slot, find the main slot
  if (isSecondarySlot(slot)) {
    const mainSlot = findSlotById(newGrid, slot.mainSlotId);
    if (!mainSlot || !isMainSlot(mainSlot)) {
      return { success: false, grid, removedStack: null };
    }
    // Remove from the main slot
    return removeItemFromGrid(grid, slot.mainSlotId, quantity);
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
      const clearedGrid = clearMultiSlotItem(newGrid, slotId);
      Object.assign(newGrid, clearedGrid);
    } else {
      // Convert main slot back to empty slot
      const emptySlot: InventoryNamespace.EmptySlot = {
        type: 'empty',
        id: slot.id,
      };
      // Replace the slot in the grid
      const rowIndex = newGrid.findIndex((r) => r.includes(slot));
      const colIndex = newGrid[rowIndex].indexOf(slot);
      newGrid[rowIndex][colIndex] = emptySlot;
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
  
  if (!fromSlot || !toSlot || !isMainSlot(fromSlot)) {
    return { success: false, grid };
  }

  // If target slot is empty, move the entire stack
  if (isSlotEmpty(toSlot)) {
    // Create new main slot with the item
    const newMainSlot: InventoryNamespace.ItemMainSlot = {
      type: 'itemMain',
      id: toSlot.id,
      itemStack: fromSlot.itemStack,
      hasSecondarySlots: fromSlot.hasSecondarySlots,
      secondarySlotPositions: fromSlot.secondarySlotPositions
    };
    
    // Convert from slot back to empty
    const emptySlot: InventoryNamespace.EmptySlot = {
      type: 'empty',
      id: fromSlot.id,
    };
    
    // Replace slots in grid
    const fromRowIndex = newGrid.findIndex((r) => r.includes(fromSlot));
    const fromColIndex = newGrid[fromRowIndex].indexOf(fromSlot);
    newGrid[fromRowIndex][fromColIndex] = emptySlot;
    
    const toRowIndex = newGrid.findIndex((r) => r.includes(toSlot));
    const toColIndex = newGrid[toRowIndex].indexOf(toSlot);
    newGrid[toRowIndex][toColIndex] = newMainSlot;
    
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
          type: 'empty',
          id: fromSlot.id,
        };
        const rowIndex = newGrid.findIndex((r) => r.includes(fromSlot));
        const colIndex = newGrid[rowIndex].indexOf(fromSlot);
        newGrid[rowIndex][colIndex] = emptySlot;
      }
      
      return { success: true, grid: newGrid };
    }
  }

  // If different items and target has an item, swap them
  if (isMainSlot(toSlot)) {
    const tempItemStack = toSlot.itemStack;
    const tempHasSecondary = toSlot.hasSecondarySlots;
    const tempSecondaryPositions = toSlot.secondarySlotPositions;
    
    toSlot.itemStack = fromSlot.itemStack;
    toSlot.hasSecondarySlots = fromSlot.hasSecondarySlots;
    toSlot.secondarySlotPositions = fromSlot.secondarySlotPositions;
    
    fromSlot.itemStack = tempItemStack;
    fromSlot.hasSecondarySlots = tempHasSecondary;
    fromSlot.secondarySlotPositions = tempSecondaryPositions;
  }
  
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

export function clearMultiSlotItem(grid: InventoryNamespace.Grid, slotId: string): InventoryNamespace.Grid {
  const newGrid = JSON.parse(JSON.stringify(grid)) as InventoryNamespace.Grid;
  const slot = findSlotById(newGrid, slotId);
  
  if (!slot || !isMainSlot(slot)) {
    return newGrid;
  }
  
  const item = slot.itemStack.item;
  const size = item.size || { width: 1, height: 1 };
  const position = getSlotPosition(newGrid, slotId);
  
  if (!position) {
    return newGrid;
  }
  
  // Clear the main slot and all secondary slots
  for (let r = position.row; r < position.row + size.height; r++) {
    for (let c = position.col; c < position.col + size.width; c++) {
      if (r < newGrid.length && c < newGrid[r].length) {
        const currentSlot = newGrid[r][c];
        // Convert all slots back to empty slots
        const emptySlot: InventoryNamespace.EmptySlot = {
          type: 'empty',
          id: currentSlot.id,
        };
        newGrid[r][c] = emptySlot;
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
  
  // Create secondary slot positions
  const secondarySlotPositions: Array<{ row: number; col: number }> = [];
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      if (r !== startRow || c !== startCol) {
        secondarySlotPositions.push({ row: r, col: c });
      }
    }
  }
  
  // Create or update the main slot (top-left)
  const currentMainSlot = newGrid[startRow][startCol];
  
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
      id: currentMainSlot.id,
      itemStack: { item, quantity },
      hasSecondarySlots: secondarySlotPositions.length > 0,
      secondarySlotPositions: secondarySlotPositions.length > 0 ? secondarySlotPositions : undefined
    };
    newGrid[startRow][startCol] = mainSlot;
  }
  
  // Create secondary slots for multi-slot items
  for (let r = startRow; r < startRow + size.height; r++) {
    for (let c = startCol; c < startCol + size.width; c++) {
      if ((r !== startRow || c !== startCol) && r < newGrid.length && c < newGrid[r].length) {
        const currentSlot = newGrid[r][c];
        const secondarySlot: InventoryNamespace.ItemSecondarySlot = {
          type: 'itemSecondary',
          id: currentSlot.id,
          mainSlotId: newGrid[startRow][startCol].id,
          mainSlotPosition: { row: startRow, col: startCol }
        };
        newGrid[r][c] = secondarySlot;
      }
    }
  }
  
  return newGrid;
}