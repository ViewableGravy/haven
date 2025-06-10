import { InventoryNamespace } from "../../components/inventory/types";
import type { GameObject } from "../base";

/***** TYPE DEFINITIONS *****/
interface InventoryData {
  grid: InventoryNamespace.Grid;
  maxSlots: number;
}



/***** INVENTORY TRAIT *****/
export class InventoryTrait {
  private data: InventoryData;

  constructor(_entity: GameObject, rows: number = InventoryNamespace.GRID_ROWS, cols: number = InventoryNamespace.GRID_COLS) {
    const grid: InventoryNamespace.Grid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = InventoryNamespace.rowColToIndex(row, col);
        grid[index] = {
          type: 'empty'
        };
      }
    }

    this.data = {
      grid,
      maxSlots: rows * cols,
    };
  }

  /***** INSTANCE METHODS *****/
  public getGrid(): InventoryNamespace.Grid {
    return this.data.grid;
  }

  public getMaxSlots(): number {
    return this.data.maxSlots;
  }

  public addItem(
    item: InventoryNamespace.Item,
    quantity: number
  ): boolean {
    const grid = this.data.grid;
    let remainingQuantity = quantity;

    // Try to stack in existing slots with the same item type first
    for (let index = 0; index < grid.length && remainingQuantity > 0; index++) {
      const slot = grid[index];
      
      if (slot.type === 'itemMain' && 
          slot.itemStack.item.id === item.id && 
          slot.itemStack.quantity < slot.itemStack.item.maxStackSize) {
        
        const canAdd = slot.itemStack.item.maxStackSize - slot.itemStack.quantity;
        const toAdd = Math.min(canAdd, remainingQuantity);
        
        slot.itemStack.quantity += toAdd;
        remainingQuantity -= toAdd;
      }
    }

    // Place remaining items in empty slots
    for (let index = 0; index < grid.length && remainingQuantity > 0; index++) {
      const slot = grid[index];
      
      if (slot.type === 'empty') {
        const toAdd = Math.min(item.maxStackSize, remainingQuantity);
        grid[index] = {
          type: 'itemMain',
          itemStack: {
            item: item,
            quantity: toAdd
          },
          hasSecondarySlots: false
        };
        remainingQuantity -= toAdd;
      }
    }

    return remainingQuantity < quantity;
  }

  public removeItem(
    itemId: string,
    quantity: number
  ): InventoryNamespace.ItemStack | null {
    const grid = this.data.grid;
    let remainingToRemove = quantity;
    let removedItem: InventoryNamespace.Item | null = null;

    // Remove from existing stacks
    for (let index = 0; index < grid.length && remainingToRemove > 0; index++) {
      const slot = grid[index];
      
      if (slot.type === 'itemMain' && slot.itemStack.item.id === itemId) {
        if (!removedItem) {
          removedItem = slot.itemStack.item;
        }

        const toRemove = Math.min(slot.itemStack.quantity, remainingToRemove);
        slot.itemStack.quantity -= toRemove;
        remainingToRemove -= toRemove;

        if (slot.itemStack.quantity <= 0) {
          grid[index] = {
            type: 'empty'
          };
        }
      }
    }

    if (removedItem && remainingToRemove < quantity) {
      return {
        item: removedItem,
        quantity: quantity - remainingToRemove
      };
    }

    return null;
  }

  public removeFromSlot(
    slotIndex: number,
    quantity: number = 1
  ): InventoryNamespace.ItemStack | null {
    const grid = this.data.grid;
    
    if (slotIndex >= 0 && slotIndex < grid.length) {
      const slot = grid[slotIndex];
      
      if (slot.type === 'itemMain') {
        const removeQuantity = Math.min(quantity, slot.itemStack.quantity);
        const removedStack: InventoryNamespace.ItemStack = {
          item: slot.itemStack.item,
          quantity: removeQuantity,
        };

        slot.itemStack.quantity -= removeQuantity;
        
        if (slot.itemStack.quantity <= 0) {
          grid[slotIndex] = {
            type: 'empty'
          };
        }

        return removedStack;
      }
    }

    return null;
  }

  public getSlot(slotIndex: number): InventoryNamespace.Slot | null {
    const grid = this.data.grid;
    
    if (slotIndex >= 0 && slotIndex < grid.length) {
      return grid[slotIndex];
    }

    return null;
  }

  public hasItem(itemId: string, quantity: number = 1): boolean {
    const grid = this.data.grid;
    let totalQuantity = 0;

    for (let index = 0; index < grid.length; index++) {
      const slot = grid[index];
      
      if (slot.type === 'itemMain' && slot.itemStack.item.id === itemId) {
        totalQuantity += slot.itemStack.quantity;
        
        if (totalQuantity >= quantity) {
          return true;
        }
      }
    }

    return false;
  }

  public getItemCount(itemId: string): number {
    const grid = this.data.grid;
    let totalQuantity = 0;

    for (let index = 0; index < grid.length; index++) {
      const slot = grid[index];
      
      if (slot.type === 'itemMain' && slot.itemStack.item.id === itemId) {
        totalQuantity += slot.itemStack.quantity;
      }
    }

    return totalQuantity;
  }

  public canAddItem(
    item: InventoryNamespace.Item,
    quantity: number
  ): boolean {
    const grid = this.data.grid;
    let remainingQuantity = quantity;

    // Check existing stacks
    for (let index = 0; index < grid.length; index++) {
      const slot = grid[index];
      
      if (slot.type === 'itemMain' && slot.itemStack.item.id === item.id) {
        const canAdd = Math.min(
          remainingQuantity,
          item.maxStackSize - slot.itemStack.quantity
        );
        remainingQuantity -= canAdd;
        
        if (remainingQuantity <= 0) {
          return true;
        }
      }
    }

    // Check empty slots
    for (let index = 0; index < grid.length; index++) {
      const slot = grid[index];
      
      if (slot.type === 'empty' && remainingQuantity > 0) {
        const canAdd = Math.min(remainingQuantity, item.maxStackSize);
        remainingQuantity -= canAdd;
        
        if (remainingQuantity <= 0) {
          return true;
        }
      }
    }

    return remainingQuantity < quantity;
  }

  public isEmpty(): boolean {
    const grid = this.data.grid;

    for (let index = 0; index < grid.length; index++) {
      if (grid[index].type === 'itemMain') {
        return false;
      }
    }

    return true;
  }

  public isFull(): boolean {
    const grid = this.data.grid;

    for (let index = 0; index < grid.length; index++) {
      const slot = grid[index];
      
      if (slot.type === 'empty') {
        return false;
      }
      
      if (slot.type === 'itemMain' && slot.itemStack.quantity < slot.itemStack.item.maxStackSize) {
        return false;
      }
    }

    return true;
  }

  public clear(): void {
    const grid = this.data.grid;

    for (let index = 0; index < grid.length; index++) {
      grid[index] = {
        type: 'empty'
      };
    }
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): boolean {
    try {
      entity.getTrait('inventory');
      return true;
    } catch {
      return false;
    }
  }

  static getGrid(entity: GameObject): InventoryNamespace.Grid | null {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').getGrid();
    }
    return null;
  }

  static addItem(entity: GameObject, item: InventoryNamespace.Item, quantity: number): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').addItem(item, quantity);
    }
    return false;
  }

  static removeItem(entity: GameObject, itemId: string, quantity: number): InventoryNamespace.ItemStack | null {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').removeItem(itemId, quantity);
    }
    return null;
  }

  static removeFromSlot(entity: GameObject, slotIndex: number, quantity: number = 1): InventoryNamespace.ItemStack | null {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').removeFromSlot(slotIndex, quantity);
    }
    return null;
  }

  static getSlot(entity: GameObject, slotIndex: number): InventoryNamespace.Slot | null {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').getSlot(slotIndex);
    }
    return null;
  }

  static hasItem(entity: GameObject, itemId: string, quantity: number = 1): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').hasItem(itemId, quantity);
    }
    return false;
  }

  static getItemCount(entity: GameObject, itemId: string): number {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').getItemCount(itemId);
    }
    return 0;
  }

  static canAddItem(entity: GameObject, item: InventoryNamespace.Item, quantity: number): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').canAddItem(item, quantity);
    }
    return false;
  }

  static isEmpty(entity: GameObject): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').isEmpty();
    }
    return true;
  }

  static isFull(entity: GameObject): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.getTrait('inventory').isFull();
    }
    return false;
  }

  static clear(entity: GameObject): void {
    if (InventoryTrait.is(entity)) {
      entity.getTrait('inventory').clear();
    }
  }
}
