import { useStore } from "@tanstack/react-store";
import classNames from "classnames";
import type React from "react";
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
  /***** HOOKS *****/
  const { slot, mainSlot, hasItem, isHovered } = useStore(
    inventoryStore,
    (state) => {
      const slot = state.grid[index];

      // Get main slot using helper function
      const mainSlot = getMainSlotFromAny(state.grid, slot);
      
      // Determine the main slot index for hover checking
      let mainSlotIndex: number | null = null;
      if (isMainSlot(slot)) {
        mainSlotIndex = index;
      } else if (isSecondarySlot(slot)) {
        mainSlotIndex = slot.mainSlotIndex;
      }
      
      return {
        slot,
        mainSlot,
        hasItem: mainSlot !== null,
        isHovered: mainSlot && mainSlotIndex !== null ? state.hoveredSlot === mainSlotIndex : false,
      };
    }
  );

  /***** COMPUTED VALUES *****/
  const slotClassName = classNames("inventory-slot", {
    "has-item": hasItem,
    occupied: isSecondarySlot(slot),
    "multi-slot-main": isMainSlot(slot) && hasItem,
  });

  const itemClassName = classNames("item-icon", {
    hovered: isHovered,
  });

  /***** HANDLERS *****/
  const handleSlotMouseEnter = () => {
    // Always attempt to set hover state if there's a main slot to hover
    if (mainSlot) {
      // Determine the main slot index for hover state
      let mainSlotIndex: number | null = null;
      if (isMainSlot(slot)) {
        mainSlotIndex = index;
      } else if (isSecondarySlot(slot)) {
        mainSlotIndex = slot.mainSlotIndex;
      }
      
      if (mainSlotIndex !== null) {
        inventoryStore.setHoveredSlot(mainSlotIndex);
      }
    }
  };

  const handleItemMouseLeave = () => {
    // Clear hover state when leaving the item
    inventoryStore.setHoveredSlot(null);
  };

  /***** RENDER *****/
  return (
    <div 
      className={slotClassName}
      onMouseEnter={handleSlotMouseEnter}
      onMouseLeave={handleItemMouseLeave}
    >
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
            
          ></div>
          {mainSlot.itemStack.quantity > 1 && (
            <div className="item-quantity">{mainSlot.itemStack.quantity}</div>
          )}
        </>
      )}
    </div>
  );
};
