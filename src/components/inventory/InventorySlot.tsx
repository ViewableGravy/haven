import { useStore } from "@tanstack/react-store";
import classNames from "classnames";
import type React from "react";
import { useState } from "react";
import {
  getMainSlotFromAny,
  isMainSlot,
  isSecondarySlot,
} from "./store/_actions";
import { inventoryStore } from "./store/index";

/***** TYPE DEFINITIONS *****/
interface InventorySlotProps {
  index: number;
}

/***** COMPONENT *****/
export const InventorySlot: React.FC<InventorySlotProps> = ({
  index,
}) => {
  /***** LOCAL STATE *****/
  const [isHovered, setIsHovered] = useState(false);

  /***** HOOKS *****/
  const { slot, mainSlot, hasItem } = useStore(
    inventoryStore,
    (state) => {
      const slot = state.grid[index];
      const mainSlot = getMainSlotFromAny(state.grid, slot);
      
      return {
        slot,
        mainSlot,
        hasItem: mainSlot !== null,
      };
    }
  );

  /***** COMPUTED VALUES *****/
  const slotClassName = classNames("InventorySlot", {
    "InventorySlot--has-item": hasItem, // Show border for any slot that's part of an item
    "InventorySlot--occupied": isSecondarySlot(slot),
    "InventorySlot--multi-slot-main": isMainSlot(slot) && hasItem,
  });

  const itemClassName = classNames("InventorySlot__item", {
    "InventorySlot__item--hovered": isHovered,
  });

  /***** HANDLERS *****/
  const handleSlotMouseEnter = () => {
    if (mainSlot) {
      setIsHovered(true);
    }
  };

  const handleSlotMouseLeave = () => {
    setIsHovered(false);
  };

  /***** RENDER *****/
  return (
    <div className={slotClassName}>
      {/* Only render item visuals in main slots, not secondary slots */}
      {mainSlot && isMainSlot(slot) && (
        <>
          <div
            className={itemClassName}
            style={
              {
                backgroundImage: `url(${mainSlot.itemStack.item.iconPath})`,
                "--item-width": mainSlot.itemStack.item.size?.width || 1,
                "--item-height": mainSlot.itemStack.item.size?.height || 1,
              } as React.CSSProperties
            }
            onMouseEnter={handleSlotMouseEnter}
            onMouseLeave={handleSlotMouseLeave}
          ></div>
          {mainSlot.itemStack.quantity > 1 && (
            <div className="InventorySlot__quantity">{mainSlot.itemStack.quantity}</div>
          )}
        </>
      )}
    </div>
  );
};
