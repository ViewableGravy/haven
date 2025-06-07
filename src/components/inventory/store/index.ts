import { useStore } from "@tanstack/react-store";
import { createElement, useEffect, type ComponentType } from "react";
import { createStore, createStoreState } from "../../../utilities/store";
import type { InventoryNamespace } from "../types";
import { addItem, getSlot, moveItem, removeItem, setSelectedSlot, toggleInventory } from "./actions";

/***** HELPER FUNCTIONS *****/
function createEmptyGrid(): InventoryNamespace.Grid {
  const grid: InventoryNamespace.Grid = [];
  for (let row = 0; row < 4; row++) {
    grid[row] = [];
    for (let col = 0; col < 4; col++) {
      grid[row][col] = {
        id: `slot-${row}-${col}`,
        itemStack: null,
      };
    }
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

/***** STORE CREATION *****/
const _inventoryStore = createStore({
  state: createStoreState<InventoryNamespace.State>({
    isOpen: false,
    selectedSlot: null,
    grid: createEmptyGrid()
  }),
  actions: {
    toggleInventory,
    setSelectedSlot,
    addItem,
    removeItem,
    moveItem,
    getSlot
  }
})

export const inventoryStore = Object.assign(_inventoryStore, {
  withRenderWhenOpen: createWithRenderWhenOpen(_inventoryStore),
});
