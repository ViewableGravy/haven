import type { InventoryNamespace } from "../../components/inventory/types";
import type { BaseEntity } from "../base";

/***** TYPE DEFINITIONS *****/
interface InventoryData {
  grid: InventoryNamespace.Grid;
  maxSlots: number;
}

export interface HasInventoryTrait {
  inventoryTrait: InventoryTrait;
}

/***** INVENTORY TRAIT *****/
export class InventoryTrait {
  private data: InventoryData;

  constructor(entity: BaseEntity, rows: number = 4, cols: number = 4) {
    const grid: InventoryNamespace.Grid = [];
    for (let row = 0; row < rows; row++) {
      grid[row] = [];
      for (let col = 0; col < cols; col++) {
        grid[row][col] = {
          id: `${entity.uid}-slot-${row}-${col}`,
          itemStack: null,
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
    for (let row = 0; row < grid.length && remainingQuantity > 0; row++) {
      for (let col = 0; col < grid[row].length && remainingQuantity > 0; col++) {
        const slot = grid[row][col];
        
        if (slot.itemStack && 
            slot.itemStack.item.id === item.id && 
            slot.itemStack.quantity < slot.itemStack.item.maxStackSize) {
          
          const canAdd = slot.itemStack.item.maxStackSize - slot.itemStack.quantity;
          const toAdd = Math.min(canAdd, remainingQuantity);
          
          slot.itemStack.quantity += toAdd;
          remainingQuantity -= toAdd;
        }
      }
    }

    // Place remaining items in empty slots
    for (let row = 0; row < grid.length && remainingQuantity > 0; row++) {
      for (let col = 0; col < grid[row].length && remainingQuantity > 0; col++) {
        const slot = grid[row][col];
        
        if (!slot.itemStack) {
          const toAdd = Math.min(item.maxStackSize, remainingQuantity);
          slot.itemStack = {
            item: item,
            quantity: toAdd
          };
          remainingQuantity -= toAdd;
        }
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
    for (let row = 0; row < grid.length && remainingToRemove > 0; row++) {
      for (let col = 0; col < grid[row].length && remainingToRemove > 0; col++) {
        const slot = grid[row][col];
        
        if (slot.itemStack && slot.itemStack.item.id === itemId) {
          if (!removedItem) {
            removedItem = slot.itemStack.item;
          }

          const toRemove = Math.min(slot.itemStack.quantity, remainingToRemove);
          slot.itemStack.quantity -= toRemove;
          remainingToRemove -= toRemove;

          if (slot.itemStack.quantity <= 0) {
            slot.itemStack = null;
          }
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
    slotId: string,
    quantity: number = 1
  ): InventoryNamespace.ItemStack | null {
    const grid = this.data.grid;
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (slot.id === slotId && slot.itemStack) {
          const removeQuantity = Math.min(quantity, slot.itemStack.quantity);
          const removedStack: InventoryNamespace.ItemStack = {
            item: slot.itemStack.item,
            quantity: removeQuantity,
          };

          slot.itemStack.quantity -= removeQuantity;
          
          if (slot.itemStack.quantity <= 0) {
            slot.itemStack = null;
          }

          return removedStack;
        }
      }
    }

    return null;
  }

  public getSlot(slotId: string): InventoryNamespace.Slot | null {
    const grid = this.data.grid;
    
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (slot.id === slotId) {
          return slot;
        }
      }
    }

    return null;
  }

  public hasItem(itemId: string, quantity: number = 1): boolean {
    const grid = this.data.grid;
    let totalQuantity = 0;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (slot.itemStack && slot.itemStack.item.id === itemId) {
          totalQuantity += slot.itemStack.quantity;
          
          if (totalQuantity >= quantity) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public getItemCount(itemId: string): number {
    const grid = this.data.grid;
    let totalQuantity = 0;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (slot.itemStack && slot.itemStack.item.id === itemId) {
          totalQuantity += slot.itemStack.quantity;
        }
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
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (slot.itemStack && slot.itemStack.item.id === item.id) {
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
    }

    // Check empty slots
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (!slot.itemStack && remainingQuantity > 0) {
          const canAdd = Math.min(remainingQuantity, item.maxStackSize);
          remainingQuantity -= canAdd;
          
          if (remainingQuantity <= 0) {
            return true;
          }
        }
      }
    }

    return remainingQuantity < quantity;
  }

  public isEmpty(): boolean {
    const grid = this.data.grid;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col].itemStack) {
          return false;
        }
      }
    }

    return true;
  }

  public isFull(): boolean {
    const grid = this.data.grid;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const slot = grid[row][col];
        
        if (!slot.itemStack) {
          return false;
        }
        
        if (slot.itemStack.quantity < slot.itemStack.item.maxStackSize) {
          return false;
        }
      }
    }

    return true;
  }

  public clear(): void {
    const grid = this.data.grid;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        grid[row][col].itemStack = null;
      }
    }
  }

  /***** STATIC METHODS *****/
  static is(entity: BaseEntity): entity is BaseEntity & HasInventoryTrait {
    return 'inventoryTrait' in entity && entity.inventoryTrait instanceof InventoryTrait;
  }

  static getGrid(entity: BaseEntity): InventoryNamespace.Grid | null {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.getGrid();
    }
    return null;
  }

  static addItem(entity: BaseEntity, item: InventoryNamespace.Item, quantity: number): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.addItem(item, quantity);
    }
    return false;
  }

  static removeItem(entity: BaseEntity, itemId: string, quantity: number): InventoryNamespace.ItemStack | null {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.removeItem(itemId, quantity);
    }
    return null;
  }

  static removeFromSlot(entity: BaseEntity, slotId: string, quantity: number = 1): InventoryNamespace.ItemStack | null {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.removeFromSlot(slotId, quantity);
    }
    return null;
  }

  static getSlot(entity: BaseEntity, slotId: string): InventoryNamespace.Slot | null {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.getSlot(slotId);
    }
    return null;
  }

  static hasItem(entity: BaseEntity, itemId: string, quantity: number = 1): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.hasItem(itemId, quantity);
    }
    return false;
  }

  static getItemCount(entity: BaseEntity, itemId: string): number {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.getItemCount(itemId);
    }
    return 0;
  }

  static canAddItem(entity: BaseEntity, item: InventoryNamespace.Item, quantity: number): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.canAddItem(item, quantity);
    }
    return false;
  }

  static isEmpty(entity: BaseEntity): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.isEmpty();
    }
    return true;
  }

  static isFull(entity: BaseEntity): boolean {
    if (InventoryTrait.is(entity)) {
      return entity.inventoryTrait.isFull();
    }
    return false;
  }

  static clear(entity: BaseEntity): void {
    if (InventoryTrait.is(entity)) {
      entity.inventoryTrait.clear();
    }
  }
}
