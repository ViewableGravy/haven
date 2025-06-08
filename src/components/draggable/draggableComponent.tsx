import { useCallback, useEffect, useRef, useState } from "react";
import { DragContext } from "./dragHandle";
import type { DraggableNamespace } from "./types";

/***** MAIN DRAGGABLE COMPONENT *****/
export const _DraggableComponentBase = ({ 
  position, 
  onPositionChange, 
  children, 
  className = "", 
  style = {} 
}: DraggableNamespace.DraggableComponentProps) => {
  /***** STATE *****/
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<DraggableNamespace.DragOffset>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /***** HANDLERS *****/
  const startDrag = useCallback((event: React.MouseEvent, dragElement: HTMLElement) => {
    if (!containerRef.current) return;
    
    // Calculate offset from the drag element to the container
    const containerRect = containerRef.current.getBoundingClientRect();
    const dragElementRect = dragElement.getBoundingClientRect();
    
    // Calculate the offset from mouse to drag element, then to container
    const mouseToElementX = event.clientX - dragElementRect.left;
    const mouseToElementY = event.clientY - dragElementRect.top;
    const elementToContainerX = dragElementRect.left - containerRect.left;
    const elementToContainerY = dragElementRect.top - containerRect.top;
    
    const totalOffsetX = mouseToElementX + elementToContainerX;
    const totalOffsetY = mouseToElementY + elementToContainerY;
    
    setIsDragging(true);
    setDragOffset({ x: totalOffsetX, y: totalOffsetY });
    
    // Prevent text selection and event propagation
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;
    
    // Get container dimensions for bounds checking
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Keep container within viewport bounds with margin
    const margin = 20;
    const maxX = window.innerWidth - containerWidth - margin;
    const maxY = window.innerHeight - containerHeight - margin;
    
    const clampedX = Math.max(margin, Math.min(newX, maxX));
    const clampedY = Math.max(margin, Math.min(newY, maxY));
    
    onPositionChange({ x: clampedX, y: clampedY });
  }, [isDragging, dragOffset, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /***** EFFECTS *****/
  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /***** CONTEXT VALUE *****/
  const contextValue: DraggableNamespace.DragContext = {
    isDragging,
    containerRef,
    startDrag,
  };

  /***** RENDER *****/
  return (
    <DragContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`DraggableComponent ${isDragging ? "DraggableComponent--dragging" : ""} ${className}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          ...style,
        }}
      >
        {children}
      </div>
    </DragContext.Provider>
  );
};
