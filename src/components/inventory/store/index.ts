import { createStore, createStoreState } from "../../../utilities/store";
import { InventoryNamespace } from "../types";
import { createGridWithDefaultItems, createWithRenderWhenOpen, getInitialPosition } from "./_actions";
import { addItem, getItemStack, getMainSlot, getSlot, moveItem, pickUpItem, placeHeldItem, removeItem, returnHeldItem, setCursorPosition, setHeldItem, setHoveredSlot, setPosition, setSelectedSlot, toggleInventory } from "./actions";

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
