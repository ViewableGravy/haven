# DRAGGABLE INVENTORY PANEL IMPLEMENTATION

```
 ____  ____      _    ____  ____    _    ____  _     _____ 
|  _ \|  _ \    / \  / ___|/ ___|  / \  | __ )| |   | ____|
| | | | |_) |  / _ \| |  _| |  _  / _ \ |  _ \| |   |  _|  
| |_| |  _ <  / ___ \ |_| | |_| |/ ___ \| |_) | |___| |___ 
|____/|_| \_\/_/   \_\____|\____/_/   \_\____/_____|_____|
                                                          
 ___ _   _ _   _ _____ _   _ _____ _____ ______   __        
|_ _| \ | | | | | ____| \ | |_   _|  _  || ___ \ \ / /       
 | ||  \| | | | |  _| |  \| | | | | | | || |_/ /  \ /        
 | || . ` | | | | |___| . ` | | | | | | ||    /   | |        
|___|_|\  \_\/ /|_____|_|\  | |_| \ \_/ /| |\ \   |_|        
      \__|   \__/        \__|     \___/ \_| \_|              
```

## High Level Overview

This implementation adds drag-and-drop functionality to the inventory panel, allowing users to 
grab the panel by its header and move it anywhere on the screen. The panel position is stored 
in the inventory store state and persists between open/close cycles, ensuring the panel reopens 
in the same location where it was last positioned.

The implementation follows React best practices using hooks for drag state management and CSS 
transforms for smooth positioning. The drag functionality is scoped only to the header area 
to prevent conflicts with item interactions within the inventory grid.

## Files to be Modified

### Core Store Files
- `src/components/inventory/types.ts` - Add position coordinates to state type
- `src/components/inventory/store/index.ts` - Add position to initial state and create position action
- `src/components/inventory/store/actions.ts` - Add setPosition action for updating panel coordinates

### Component Files  
- `src/components/inventory/index.tsx` - Add drag handlers and position styling to main panel
- `src/components/inventory/styles.scss` - Update CSS to support dynamic positioning

## Architecture Changes

```
Before:
InventoryPanel
├── Fixed position (center screen)
├── Static CSS positioning  
└── No position state

After:
InventoryPanel
├── Dynamic position from store state
├── Drag handlers on header element
├── Position state persistence
└── Transform-based positioning

Store State Extension:
├── position: { x: number, y: number }
├── setPosition action
└── Position persistence across open/close
```

## Implementation Strategy

### Phase 1: State Extension
Update the inventory state type to include position coordinates and modify the store to handle position updates.

### Phase 2: Drag Implementation  
Add mouse event handlers to the header element for drag start, drag move, and drag end functionality.

### Phase 3: Position Persistence
Ensure the panel position is maintained in store state and applied when the panel reopens.

### Phase 4: CSS Updates
Modify the panel styling to use transform-based positioning instead of fixed centering.

## Final Result

Users will be able to:
- **Drag the inventory panel** by clicking and holding the header area
- **Position the panel anywhere** on the screen for optimal gameplay
- **Maintain panel position** across inventory open/close cycles  
- **Enjoy smooth dragging** with proper mouse cursor feedback

The implementation maintains all existing inventory functionality while adding intuitive 
drag-and-drop positioning that enhances the user experience and interface flexibility.
