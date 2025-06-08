# DRAGGABLE COMPOUND COMPONENT ABSTRACTION

```
██████╗ ██████╗  █████╗  ██████╗  ██████╗  █████╗ ██████╗ ██╗     ███████╗
██╔══██╗██╔══██╗██╔══██╗██╔════╝ ██╔════╝ ██╔══██╗██╔══██╗██║     ██╔════╝
██║  ██║██████╔╝███████║██║  ███╗██║  ███╗███████║██████╔╝██║     █████╗  
██║  ██║██╔══██╗██╔══██║██║   ██║██║   ██║██╔══██║██╔══██╗██║     ██╔══╝  
██████╔╝██║  ██║██║  ██║╚██████╔╝╚██████╔╝██║  ██║██████╔╝███████╗███████╗
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝

 ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███╗   ██╗███████╗███╗   ██╗████████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗████╗  ██║██╔════╝████╗  ██║╚══██╔══╝
██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║   ██║   
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║   ██║   
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝██║ ╚████║███████╗██║ ╚████║   ██║   
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
```

## High Level Overview

This implementation abstracts the dragging functionality from the inventory component into a reusable 
compound component called `DraggableComponent`. The component will follow the compound component pattern 
with a main wrapper component and a nested drag handle component for flexibility in UI design.

The `DraggableComponent` will manage all drag state, mouse events, position calculation, and viewport 
bounds checking internally, exposing a clean API for consumers. The `DraggableComponent.DragHandle` 
sub-component allows precise control over which areas of the UI can initiate dragging.

## Files to be Created/Modified

### New Files to Create
- `src/components/draggable/index.tsx` - Main DraggableComponent with compound pattern
- `src/components/draggable/types.ts` - Type definitions for draggable functionality
- `src/components/draggable/styles.scss` - Base styles for draggable components

### Files to Modify
- `src/components/inventory/index.tsx` - Refactor to use DraggableComponent
- `src/components/inventory/styles.scss` - Remove drag-specific styles (move to draggable)

## Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DraggableComponent                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Props:                                                         │
│  ├── position: { x: number, y: number }                        │
│  ├── onPositionChange: (pos: { x: number, y: number }) => void │
│  ├── children: React.ReactNode                                 │
│  └── className?: string                                        │
│                                                                 │
│  Internal State:                                               │
│  ├── isDragging: boolean                                       │
│  ├── dragOffset: { x: number, y: number }                     │
│  └── containerRef: React.RefObject<HTMLDivElement>            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                DragHandle Component                        │ │
│  │                                                             │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │ │
│  │  │ onMouseDown │───▶│ Start Drag  │───▶│ Set Offset  │     │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘     │ │
│  │                                               │             │ │
│  │                                               ▼             │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │ │
│  │  │Global Mouse │───▶│Update Pos   │───▶│Clamp Bounds │     │ │
│  │  │Move Listener│    │Calculation  │    │& Callback   │     │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Component Creation
Create the base `DraggableComponent` with compound pattern architecture, including the drag handle 
sub-component and all necessary type definitions.

### Phase 2: Drag Logic Extraction
Extract and adapt the existing drag logic from the inventory component into the reusable component, 
ensuring proper bounds checking and smooth dragging behavior.

### Phase 3: Inventory Refactor
Refactor the inventory component to use the new `DraggableComponent`, removing duplicate drag code 
and maintaining all existing functionality.

### Phase 4: Style Organization
Move drag-related styles to the draggable component's stylesheet and update the inventory styles 
to remove the now-redundant drag styling.

## Component Usage Example

```tsx
// Usage in inventory or other windows
<DraggableComponent 
  position={position} 
  onPositionChange={setPosition}
  className="window-panel"
>
  <DraggableComponent.DragHandle>
    <div className="window-header">
      <h3>Window Title</h3>
      <button onClick={onClose}>×</button>
    </div>
  </DraggableComponent.DragHandle>
  
  <div className="window-content">
    {/* Window content goes here */}
  </div>
</DraggableComponent>
```

## Final Implementation Result

This abstraction will provide:
- **Reusable dragging functionality** for any UI window or panel
- **Clean compound component API** following React best practices  
- **Flexible drag handle placement** for different UI designs
- **Maintained inventory functionality** with cleaner, more focused code
- **Foundation for future windows** like crafting panels, settings, etc.

The implementation maintains full backward compatibility with existing inventory behavior while 
providing a robust foundation for expanding the UI system with additional draggable windows.
