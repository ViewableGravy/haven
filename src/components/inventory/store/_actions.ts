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
      if (!slot.itemStack && remainingQuantity > 0) {
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
  
  if (!slot || !slot.itemStack) {
    return { success: false, grid, removedStack: null };
  }

  const removeQuantity = Math.min(quantity, slot.itemStack.quantity);
  const removedStack: InventoryNamespace.ItemStack = {
    item: slot.itemStack.item,
    quantity: removeQuantity,
  };

  slot.itemStack.quantity -= removeQuantity;
  
  if (slot.itemStack.quantity <= 0) {
    slot.itemStack = null;
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