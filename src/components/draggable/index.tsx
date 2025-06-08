import { _DraggableComponentBase } from "./draggableComponent";
import { _DragHandle } from "./dragHandle";
import "./styles.scss";

/***** COMPOUND COMPONENT EXPORT *****/
export const DraggableComponent = Object.assign(_DraggableComponentBase, {
  DragHandle: _DragHandle,
});
