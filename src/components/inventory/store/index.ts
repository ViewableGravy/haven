import { useStore } from "@tanstack/react-store";
import { createElement, useEffect, type ComponentType } from "react";
import { DuckItem } from "../../../entities/items/duck";
import { TwigItem } from "../../../entities/items/twig";
import { createStore, createStoreState } from "../../../utilities/store";
import { InventoryNamespace } from "../types";
import { addItemToGrid } from "./_actions";
import { addItem, getItemStack, getMainSlot, getSlot, moveItem, pickUpItem, placeHeldItem, removeItem, returnHeldItem, setCursorPosition, setHeldItem, setHoveredSlot, setPosition, setSelectedSlot, toggleInventory } from "./actions";

function createGridWithDefaultItems(): InventoryNamespace.Grid {
  // Initialize as 1D array with 16 empty slots (4x4)
  let grid: InventoryNamespace.Grid = [];
  for (let index = 0; index < 16; index++) {
    grid[index] = {
      type: 'empty',
    } as InventoryNamespace.EmptySlot;
  }
  
  // Add twig item to first slot (index 0) using proper grid function
  const twigItem = new TwigItem();
  const twigResult = addItemToGrid(grid, twigItem, 3);
  if (twigResult.success) {
    grid = twigResult.grid;
  }
  
  // Add duck item using proper grid function (will handle multi-slot placement)
  const duckItem = new DuckItem();
  const duckResult = addItemToGrid(grid, duckItem, 1);
  if (duckResult.success) {
    grid = duckResult.grid;
  }
  
  return grid;
}

function createWithRenderWhenOpen(store: typeof _inventoryStore) {
  return <T extends object = {}>(component: ComponentType<T>) => {
    return ((props: T) => {
      const isOpen = useStore(store, (state) => state.isOpen);

      useEffect(() => {
        const handleKeypress = (event: KeyboardEvent) => {
          if (event.code === "KeyI") {
            (store as any).toggleInventory();
          }
        };
        
        document.addEventListener("keypress", handleKeypress);
        return () => {
          document.removeEventListener("keypress", handleKeypress);
        };
      }, []);

      if (!isOpen) {
        return null; // Don't render if inventory is closed
      }

      return createElement(component, props);
    });
  }
}

// Get initial centered position safely
function getInitialPosition(): { x: number; y: number } {
  if (typeof window !== 'undefined') {
    const centerX = Math.max(20, (window.innerWidth - 400) / 2);
    const centerY = Math.max(20, (window.innerHeight - 300) / 2);
    return { x: centerX, y: centerY };
  }
  return { x: 300, y: 200 }; // Safe fallback position
}

/***** STORE CREATION *****/
const _inventoryStore = createStore({
  state: createStoreState<InventoryNamespace.State>({
    isOpen: false,
    selectedSlot: null,
    grid: createGridWithDefaultItems(),
    position: getInitialPosition(),
    heldItem: null,
    hoveredSlot: null,
    cursorPosition: { x: 0, y: 0 }
  }),
  actions: {
    toggleInventory,
    setSelectedSlot,
    setPosition,
    addItem,
    removeItem,
    moveItem,
    getSlot,
    getMainSlot,
    getItemStack,
    setHeldItem,
    setHoveredSlot,
    setCursorPosition,
    pickUpItem,
    placeHeldItem,
    returnHeldItem
  }
})

export const inventoryStore = Object.assign(_inventoryStore, {
  withRenderWhenOpen: createWithRenderWhenOpen(_inventoryStore),
});
