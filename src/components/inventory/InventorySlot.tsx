import { useStore } from "@tanstack/react-store";
import classNames from "classnames";
import type React from "react";
import { useCallback, useState } from "react";
import {
  canPlaceItemAtSlot,
  getItemOccupiedSlots,
  getMainSlotFromAny,
  getSlotByIndex,
  isMainSlot,
  isSecondarySlot,
} from "./store/_actions";
import { inventoryStore } from "./store/index";
import { InventoryNamespace } from "./types";

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
    "InventorySlot--secondary-hovered": isSecondarySlot(slot) && isHovered,
  });

  const itemClassName = classNames("InventorySlot__item", {
    "InventorySlot__item--hovered": isHovered && isMainSlot(slot),
  });

  /***** HELPER FUNCTIONS *****/
  // Helper function to calculate where the item's main slot should be placed
  const calculateTargetMainSlot = useCallback((hoveredSlot: number, heldItem: InventoryNamespace.HeldItem): number => {
    // Validate inputs
    if (!heldItem || !heldItem.itemStack || !heldItem.itemStack.item) {
      return -1;
    }
    
    // Validate slot index
    if (!InventoryNamespace.isValidIndex(hoveredSlot)) {
      return -1;
    }
    
    const item = heldItem.itemStack.item;
    const size = item.size || { width: 1, height: 1 };
    
    // Validate item size
    if (size.width <= 0 || size.height <= 0) {
      return -1;
    }
    
    // Calculate which slot within the item was originally clicked
    const slotSize = 64; // Should match CSS --slot-size
    const slotGap = 4;   // Should match CSS --slot-gap
    const slotWidth = slotSize + slotGap;
    
    // Validate cursor offset
    if (!heldItem.cursorOffset || 
        typeof heldItem.cursorOffset.x !== 'number' || 
        typeof heldItem.cursorOffset.y !== 'number' ||
        isNaN(heldItem.cursorOffset.x) ||
        isNaN(heldItem.cursorOffset.y)) {
      return -1;
    }
    
    // Determine which relative slot was clicked based on cursor offset
    const clickedSlotOffsetX = Math.floor(Math.max(0, heldItem.cursorOffset.x) / slotWidth);
    const clickedSlotOffsetY = Math.floor(Math.max(0, heldItem.cursorOffset.y) / slotWidth);
    
    // Additional validation for calculated offsets
    if (isNaN(clickedSlotOffsetX) || isNaN(clickedSlotOffsetY) ||
        clickedSlotOffsetX < 0 || clickedSlotOffsetY < 0) {
      return -1;
    }
    
    // Calculate the main slot position
    const hoveredPosition = InventoryNamespace.indexToRowCol(hoveredSlot);
    const targetMainRow = hoveredPosition.row - clickedSlotOffsetY;
    const targetMainCol = hoveredPosition.col - clickedSlotOffsetX;
    
    // Ensure the target main slot is within bounds
    if (targetMainRow < 0 || targetMainCol < 0 || 
        targetMainRow >= InventoryNamespace.GRID_ROWS || 
        targetMainCol >= InventoryNamespace.GRID_COLS) {
      return -1; // Invalid position
    }
    
    // Ensure the entire item fits within the grid
    if (targetMainRow + size.height > InventoryNamespace.GRID_ROWS ||
        targetMainCol + size.width > InventoryNamespace.GRID_COLS) {
      return -1; // Invalid position
    }
    
    const targetIndex = InventoryNamespace.rowColToIndex(targetMainRow, targetMainCol);
    
    // Final validation of the calculated index
    if (!InventoryNamespace.isValidIndex(targetIndex)) {
      return -1;
    }
    
    return targetIndex;
  }, []);

  /***** HANDLERS *****/
  const handleSlotMouseEnter = useCallback(() => {
    // Validate slot index before processing
    if (!InventoryNamespace.isValidIndex(index)) {
      return;
    }
    
    // Show hover effect for any part of a multi-slot item
    if (mainSlot) {
      setIsHovered(true);
    }
    
    // Set hovered slot for drag validation
    if (heldItem) {
      // Calculate the target main slot based on where the user originally clicked on the item
      const targetMainSlot = calculateTargetMainSlot(index, heldItem);
      
      // Only set the hovered slot if the target is valid
      if (targetMainSlot >= 0) {
        inventoryStore.setHoveredSlot(targetMainSlot);
      } else {
        // Clear hovered slot if the target is invalid
        inventoryStore.setHoveredSlot(null);
      }
    }
  }, [mainSlot, heldItem, index, calculateTargetMainSlot]);

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
      // Calculate the target main slot based on where the user originally clicked on the item
      const targetMainSlot = calculateTargetMainSlot(index, heldItem);
      
      // Try to place the held item at the calculated target position
      if (targetMainSlot >= 0 && canPlaceItemAtSlot(inventoryStore.state.grid, heldItem.itemStack.item, targetMainSlot)) {
        inventoryStore.placeHeldItem(targetMainSlot);
      } else {
        // If placement is invalid, return the item to its origin
        inventoryStore.returnHeldItem();
      }
    } else if (mainSlot) {
      // Pick up the item - can click on any part of a multi-slot item
      const grid = inventoryStore.state.grid;
      
      // Find the main slot index (either current slot if it's main, or the main slot this secondary slot points to)
      const mainSlotIndex = isMainSlot(slot) ? index : 
                           isSecondarySlot(slot) ? slot.mainSlotIndex : 
                           index;
      
      // Get the actual main slot
      const actualMainSlot = getSlotByIndex(grid, mainSlotIndex);
      if (!actualMainSlot || !isMainSlot(actualMainSlot)) {
        return;
      }
      
      // Calculate cursor offset relative to the main slot's position
      const clickedSlotRect = event.currentTarget.getBoundingClientRect();
      const mainSlotPosition = InventoryNamespace.indexToRowCol(mainSlotIndex);
      const clickedSlotPosition = InventoryNamespace.indexToRowCol(index);
      
      // Calculate the offset within the main slot's coordinate system
      const slotSize = 64; // Should match CSS --slot-size
      const slotGap = 4;   // Should match CSS --slot-gap
      
      const relativeSlotOffsetX = (clickedSlotPosition.col - mainSlotPosition.col) * (slotSize + slotGap);
      const relativeSlotOffsetY = (clickedSlotPosition.row - mainSlotPosition.row) * (slotSize + slotGap);
      
      const offsetX = (event.clientX - clickedSlotRect.left) + relativeSlotOffsetX;
      const offsetY = (event.clientY - clickedSlotRect.top) + relativeSlotOffsetY;
      
      // Set the initial cursor position when picking up
      inventoryStore.setCursorPosition({ x: event.clientX, y: event.clientY });
      inventoryStore.pickUpItem(mainSlotIndex, { x: offsetX, y: offsetY });
    }
  }, [heldItem, mainSlot, slot, index, calculateTargetMainSlot]);

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
