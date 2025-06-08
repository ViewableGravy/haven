import { useStore } from "@tanstack/react-store";
import { useMouse } from "@uidotdev/usehooks";
import { useCallback } from "react";
import { DraggableComponent } from "../draggable";
import { InventorySlot } from "./InventorySlot";
import { inventoryStore } from "./store";
import "./styles.scss";

/***** COMPONENT *****/
export const InventoryPanel = inventoryStore.withRenderWhenOpen(() => {
  /***** HOOKS *****/
  const [cursorPosition] = useMouse();
  const grid = useStore(inventoryStore, (state) => state.grid);
  const position = useStore(inventoryStore, (state) => state.position);
  const heldItem = useStore(inventoryStore, (state) => state.heldItem);

  /***** HANDLERS *****/
  const handleClose = useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering drag
    inventoryStore.toggleInventory();
    inventoryStore.setSelectedSlot(null);
  }, []);

  return (
    <>
      <DraggableComponent
        position={position}
        onPositionChange={(position) => inventoryStore.setPosition(position)}
        className="InventoryPanel"
      >
        <DraggableComponent.DragHandle>
          <div className="InventoryPanel__header">
            <h3>Inventory</h3>
            <button className="InventoryPanel__close-button" onClick={handleClose}>
              ×
            </button>
          </div>
        </DraggableComponent.DragHandle>
        
        <div className="InventoryPanel__content">
          <div className="InventoryPanel__grid">
            {grid.map((_, index) => <InventorySlot key={index} index={index} />)}
          </div>
        </div>
      </DraggableComponent>
      
      {/* Render held item following cursor at document root level */}
      {heldItem && (
        <div 
          className="InventoryPanel__drag-item"
          style={{
            left: cursorPosition.x - heldItem.cursorOffset.x,
            top: cursorPosition.y - heldItem.cursorOffset.y,
            backgroundImage: `url(${heldItem.itemStack.item.iconPath})`,
            "--item-width": heldItem.itemStack.item.size?.width || 1,
            "--item-height": heldItem.itemStack.item.size?.height || 1,
          } as React.CSSProperties}
        >
          {heldItem.itemStack.quantity > 1 && (
            <div className="InventoryPanel__drag-item-quantity">
              {heldItem.itemStack.quantity}
            </div>
          )}
        </div>
      )}
    </>
  );
});
