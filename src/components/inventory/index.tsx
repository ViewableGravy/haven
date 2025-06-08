import { useStore } from "@tanstack/react-store";
import { InventorySlot } from "./InventorySlot";
import { inventoryStore } from "./store";
import "./styles.css";

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
    <div className="inventory-panel">
      <div className="inventory-header">
        <h3>Inventory</h3>
        <button className="close-button" onClick={handleClose}>
          ×
        </button>
      </div>
      <div className="inventory-content">
        <div className="inventory-grid">
          {grid.map((_, index) => (
            <InventorySlot
              key={index}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
