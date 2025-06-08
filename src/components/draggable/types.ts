/***** TYPE DEFINITIONS *****/
export namespace DraggableNamespace {
  export type Position = {
    x: number;
    y: number;
  };

  export type DragOffset = {
    x: number;
    y: number;
  };

  export interface DraggableComponentProps {
    position: Position;
    onPositionChange: (position: Position) => void;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface DragHandleProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
  }

  export interface DragContext {
    isDragging: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
    startDrag: (event: React.MouseEvent, element: HTMLElement) => void;
  }
}
