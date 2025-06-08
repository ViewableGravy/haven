import { createContext, useCallback, useContext } from "react";
import type { DraggableNamespace } from "./types";

/***** TYPE DEFINITIONS *****/
export const DragContext = createContext<DraggableNamespace.DragContext | null>(null);

/***** DRAG HANDLE COMPONENT *****/
export const _DragHandle = ({ children, className = "", style, disabled = false }: DraggableNamespace.DragHandleProps) => {
  const context = useContext(DragContext);
  
  if (!context) {
    throw new Error("DragHandle must be used within a DraggableComponent");
  }

  const { isDragging, startDrag } = context;

  /***** HANDLERS *****/
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    
    const target = event.currentTarget as HTMLElement;
    startDrag(event, target);
  }, [disabled, startDrag]);

  /***** RENDER *****/
  return (
    <div
      className={`DraggableComponent__DragHandle ${isDragging ? "DraggableComponent__DragHandle--dragging" : ""} ${disabled ? "DraggableComponent__DragHandle--disabled" : ""} ${className}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};
