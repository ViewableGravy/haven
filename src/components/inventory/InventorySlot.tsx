import { useStore } from "@tanstack/react-store";
import classNames from "classnames";
import type React from "react";
import { inventoryStore } from "./store/index";

/***** TYPE DEFINITIONS *****/
interface InventorySlotProps {
  rowIndex: number;
  colIndex: number;
}

/***** COMPONENT *****/
export const InventorySlot: React.FC<InventorySlotProps> = ({
  rowIndex,
  colIndex,
}) => {
  /***** HOOKS *****/
  const { slot, mainSlot, isMainSlot, isSelected, hasItem } = useStore(inventoryStore, (state) => {
    const slot = state.grid[rowIndex][colIndex];
    
    // Find the main slot if this slot is occupied by another slot
    const getMainSlot = () => {
      if (slot.occupiedBy) {
        for (const row of state.grid) {
          for (const gridSlot of row) {
            if (gridSlot.id === slot.occupiedBy) {
              return gridSlot;
            }
          }
        }
      }
      return slot;
    };

    const mainSlot = getMainSlot();

    return {
      slot,
      mainSlot,
      get isMainSlot() { return mainSlot.id === slot.id},
      get isSelected() { return state.selectedSlot === slot.id },
      get hasItem() { return !!mainSlot.itemStack }
    };
  });

  /***** COMPUTED VALUES *****/
  const slotClassName = classNames('inventory-slot', {
    selected: isSelected,
    'has-item': hasItem,
    occupied: slot.occupiedBy && !isMainSlot,
    'multi-slot-main': isMainSlot && hasItem && mainSlot.itemStack?.item.size && 
      (mainSlot.itemStack.item.size.width > 1 || mainSlot.itemStack.item.size.height > 1),
  });

  /***** HANDLERS *****/
  const handleClick = () => {
    // Always interact with the main slot, even if clicking on an occupied slot
    const targetSlotId = mainSlot.id;
    const isMainSelected = isSelected;
    inventoryStore.setSelectedSlot(isMainSelected ? null : targetSlotId);
  };

  const handleDoubleClick = () => {
    if (mainSlot.itemStack) {
      // Double click to use/consume item
      console.log(`Using item: ${mainSlot.itemStack.item.name}`);
      inventoryStore.removeItem(mainSlot.id, 1);
    }
  };

  /***** RENDER *****/
  return (
    <div
      className={slotClassName}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isMainSlot && mainSlot.itemStack && (
        <>
          <div
            className="item-icon"
            style={{
              backgroundImage: `url(${mainSlot.itemStack.item.iconPath})`,
              '--item-width': mainSlot.itemStack.item.size?.width || 1,
              '--item-height': mainSlot.itemStack.item.size?.height || 1,
            } as React.CSSProperties}
          />
          {mainSlot.itemStack.quantity > 1 && (
            <div className="item-quantity">{mainSlot.itemStack.quantity}</div>
          )}
        </>
      )}
    </div>
  );
};
