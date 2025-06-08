import { useStore } from "@tanstack/react-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { InventorySlot } from "./InventorySlot";
import { inventoryStore } from "./store";
import "./styles.scss";

/***** COMPONENT *****/
export const InventoryPanel = inventoryStore.withRenderWhenOpen(() => {
  /***** HOOKS *****/
  const grid = useStore(inventoryStore, (state) => state.grid);
  const position = useStore(inventoryStore, (state) => state.position);
  const heldItem = useStore(inventoryStore, (state) => state.heldItem);
  const cursorPosition = useStore(inventoryStore, (state) => state.cursorPosition);
  
  /***** DRAG STATE *****/
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  /***** HANDLERS *****/
  const handleClose = useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering drag
    inventoryStore.toggleInventory();
    inventoryStore.setSelectedSlot(null);
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Don't start dragging if clicking the close button
    if ((event.target as HTMLElement).closest('.InventoryPanel__close-button')) {
      return;
    }
    
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    setIsDragging(true);
    setDragOffset({ x: offsetX, y: offsetY });
    
    // Prevent text selection during drag and event propagation
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;
    
    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;
    
    // Get actual panel dimensions
    const panelRect = panelRef.current.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;
    
    // Keep panel within viewport bounds with some margin
    const margin = 20;
    const maxX = window.innerWidth - panelWidth - margin;
    const maxY = window.innerHeight - panelHeight - margin;
    
    const clampedX = Math.max(margin, Math.min(newX, maxX));
    const clampedY = Math.max(margin, Math.min(newY, maxY));
    
    inventoryStore.setPosition({ x: clampedX, y: clampedY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Track cursor position for drag item rendering
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      inventoryStore.setCursorPosition({ x: event.clientX, y: event.clientY });
    };

    if (heldItem) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [heldItem]);

  return (
    <>
      <div
        ref={panelRef}
        className="InventoryPanel"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div 
          className="InventoryPanel__header" 
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
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
