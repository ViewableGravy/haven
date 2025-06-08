import { useStore } from "@tanstack/react-store";
import { InventorySlot } from "./InventorySlot";
import { inventoryStore } from "./store";
import "./styles.scss";

/***** COMPONENT *****/
export const InventoryPanel = inventoryStore.withRenderWhenOpen(() => {
  /***** HOOKS *****/
  const grid = useStore(inventoryStore, (state) => state.grid);

  /***** HANDLERS *****/
  const handleClose = () => {
    inventoryStore.toggleInventory();
    inventoryStore.setSelectedSlot(null);
  };

  return (
    <div className="InventoryPanel">
      <div className="InventoryPanel__header">
        <h3>Inventory</h3>
        <button className="InventoryPanel__close-button" onClick={handleClose}>
          ×
        </button>
      </div>
      <div className="InventoryPanel__content">
        <div className="InventoryPanel__grid">
          {grid.map((_, index) => <InventorySlot key={index} index={index} />)}
        </div>
      </div>
    </div>
  );
});
