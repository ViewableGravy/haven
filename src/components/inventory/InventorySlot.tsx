import { useStore } from "@tanstack/react-store";
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
  const slot = useStore(inventoryStore, (state) => state.grid[rowIndex][colIndex]);
  const selectedSlot = useStore(inventoryStore, (state) => state.selectedSlot);
  
  const isSelected = selectedSlot === slot.id;

  /***** HANDLERS *****/
  const handleClick = () => {
    inventoryStore.setSelectedSlot(isSelected ? null : slot.id);
  };

  const handleDoubleClick = () => {
    if (slot.itemStack) {
      // Double click to use/consume item
      console.log(`Using item: ${slot.itemStack.item.name}`);
      inventoryStore.removeItem(slot.id, 1);
    }
  };

  /***** RENDER *****/
  return (
    <div
      className={`inventory-slot ${isSelected ? "selected" : ""} ${slot.itemStack ? "has-item" : ""}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {slot.itemStack && (
        <>
          <div
            className="item-icon"
            style={{
              backgroundImage: `url(${slot.itemStack.item.iconPath})`,
            }}
          />
          {slot.itemStack.quantity > 1 && (
            <div className="item-quantity">{slot.itemStack.quantity}</div>
          )}
        </>
      )}
    </div>
  );
};
