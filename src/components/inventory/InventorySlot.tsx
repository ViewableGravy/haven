import { useStore } from "@tanstack/react-store";
import classNames from "classnames";
import type React from "react";
import { useCallback, useState } from "react";
import {
  canPlaceItemAtSlot,
  getItemOccupiedSlots,
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
  const { slot, mainSlot, hasItem, heldItem, isHighlighted, canPlace } = useStore(
    inventoryStore,
    (state) => {
      const slot = state.grid[index];
      const mainSlot = getMainSlotFromAny(state.grid, slot);
      const heldItem = state.heldItem;
      const hoveredSlot = state.hoveredSlot;
      
      // Check if this slot would be highlighted during drag
      let isHighlighted = false;
      let canPlace = false;
      
      if (heldItem && hoveredSlot !== null) {
        const occupiedSlots = getItemOccupiedSlots(hoveredSlot, heldItem.itemStack.item);
        isHighlighted = occupiedSlots.includes(index);
        canPlace = canPlaceItemAtSlot(state.grid, heldItem.itemStack.item, hoveredSlot);
      }
      
      return {
        slot,
        mainSlot,
        hasItem: mainSlot !== null,
        heldItem,
        isHighlighted,
        canPlace,
      };
    }
  );

  /***** COMPUTED VALUES *****/
  const slotClassName = classNames("InventorySlot", {
    "InventorySlot--has-item": hasItem, // Show border for any slot that's part of an item
    "InventorySlot--occupied": isSecondarySlot(slot),
    "InventorySlot--multi-slot-main": isMainSlot(slot) && hasItem,
    "InventorySlot--highlighted": isHighlighted,
    "InventorySlot--valid-drop": isHighlighted && canPlace,
    "InventorySlot--invalid-drop": isHighlighted && !canPlace,
  });

  const itemClassName = classNames("InventorySlot__item", {
    "InventorySlot__item--hovered": isHovered,
  });

  /***** HANDLERS *****/
  const handleSlotMouseEnter = useCallback(() => {
    if (mainSlot) {
      setIsHovered(true);
    }
    
    // Set hovered slot for drag validation
    if (heldItem) {
      inventoryStore.setHoveredSlot(index);
    }
  }, [mainSlot, heldItem, index]);

  const handleSlotMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    // Clear hovered slot
    if (heldItem) {
      inventoryStore.setHoveredSlot(null);
    }
  }, [heldItem]);

  const handleSlotClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (heldItem) {
      // Try to place the held item - check if it's valid first
      if (canPlaceItemAtSlot(inventoryStore.state.grid, heldItem.itemStack.item, index)) {
        inventoryStore.placeHeldItem(index);
      } else {
        // If placement is invalid, return the item to its origin
        inventoryStore.returnHeldItem();
      }
    } else if (mainSlot && isMainSlot(slot)) {
      // Pick up the item
      const rect = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      
      // Set the initial cursor position when picking up
      inventoryStore.setCursorPosition({ x: event.clientX, y: event.clientY });
      inventoryStore.pickUpItem(index, { x: offsetX, y: offsetY });
    }
  }, [heldItem, mainSlot, slot, index]);

  /***** RENDER *****/
  return (
    <div 
      className={slotClassName}
      onMouseEnter={handleSlotMouseEnter}
      onMouseLeave={handleSlotMouseLeave}
      onClick={handleSlotClick}
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
            <div className="InventorySlot__quantity">{mainSlot.itemStack.quantity}</div>
          )}
        </>
      )}
    </div>
  );
};
