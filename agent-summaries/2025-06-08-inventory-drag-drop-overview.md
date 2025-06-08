```
 ██████╗ ██████╗  █████╗  ██████╗      █████╗ ███╗   ██╗██████╗     ██████╗ ██████╗  ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗██╔════╝     ██╔══██╗████╗  ██║██╔══██╗    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
██║  ██║██████╔╝███████║██║  ███╗    ███████║██╔██╗ ██║██║  ██║    ██║  ██║██████╔╝██║   ██║██████╔╝
██║  ██║██╔══██╗██╔══██║██║   ██║    ██╔══██║██║╚██╗██║██║  ██║    ██║  ██║██╔══██╗██║   ██║██╔═══╝ 
██████╔╝██║  ██║██║  ██║╚██████╔╝    ██║  ██║██║ ╚████║██████╔╝    ██████╔╝██║  ██║╚██████╔╝██║     
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝     
                                                                                                      
██╗███╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗ ██████╗ ██████╗ ██╗   ██╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
██║████╗  ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
██║██╔██╗ ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝ ╚████╔╝     ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗  ╚██╔╝      ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
██║██║ ╚████║ ╚████╔╝ ███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║   ██║       ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
```

## High Level Overview

This implementation creates a comprehensive drag-and-drop inventory system where players can click items to pick them up, 
move them with their cursor, and place them into valid slots. The system handles item size validation, slot highlighting, 
and prevents invalid placements. The dragged item follows the cursor with smooth visual feedback.

The system maintains separation of concerns with the store managing state, components handling UI interactions, and 
proper validation ensuring game rules are enforced. Items can only be placed in valid positions based on their size 
and available space in the inventory grid.

## Files to be Modified

1. **src/components/inventory/store.ts** - Add held item state and drag validation logic
2. **src/components/inventory/index.tsx** - Add cursor-following drag item renderer
3. **src/components/inventory/InventorySlot.tsx** - Add click handlers and hover highlighting
4. **src/components/inventory/styles.scss** - Add styles for drag state and highlighting
5. **src/components/inventory/types.ts** - Add drag-related type definitions (if needed)

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Inventory Drag System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Mouse Click │───▶│ Pick Up Item│───▶│ Hold in Hand│         │
│  │  on Slot    │    │ from Slot   │    │ (Follows    │         │
│  └─────────────┘    └─────────────┘    │  Cursor)    │         │
│                                        └─────────────┘         │
│                                               │                 │
│                                               ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Place Item  │◀───│Validate Slot│◀───│ Hover Slot  │         │
│  │  in Slot    │    │  Placement  │    │ (Highlight  │         │
│  └─────────────┘    └─────────────┘    │  if Valid)  │         │
│                                        └─────────────┘         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                   Validation Logic                         │ │
│ │ • Check if item fits in target position                   │ │
│ │ • Validate no overlapping with existing items             │ │
│ │ • Prevent placement in secondary slots                    │ │
│ │ • Highlight valid/invalid drop zones                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## State Flow

```
Inventory Store State:
├── grid: Array<Item | null>                 // 1D grid representation
├── selectedSlot: number | null              // Currently selected slot
├── heldItem: HeldItem | null                // Item being dragged
├── hoveredSlot: number | null               // Slot being hovered during drag
└── position: { x: number, y: number }      // Panel position

HeldItem State:
├── item: Item                               // The actual item data
├── originSlot: number                       // Where it came from
├── cursorOffset: { x: number, y: number }   // Offset from cursor
```

## Implementation Details

The drag system works by maintaining a `heldItem` state that tracks the item being dragged and its origin slot. 
When an item is picked up, it's removed from the grid and stored in this state. The item then renders at the cursor 
position with a slight offset for natural feel.

During hover over potential drop slots, the system validates if the item can fit by checking grid boundaries and 
existing item conflicts. Valid slots are highlighted in green, invalid slots in red. Only on successful click 
in a valid position is the item actually placed back into the grid.

This approach ensures smooth visual feedback while maintaining data integrity and preventing invalid game states.
