# INVENTORY 1D ARRAY & CSS GRID CONVERSION

```
██╗███╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗ ██████╗ ██████╗ ██╗   ██╗
██║████╗  ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
██║██╔██╗ ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝ ╚████╔╝ 
██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗  ╚██╔╝  
██║██║ ╚████║ ╚████╔╝ ███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║   ██║   
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

 ██████╗ ██████╗ ██╗██████╗      ██████╗ ██████╗ ███╗   ██╗██╗   ██╗
██╔════╝ ██╔══██╗██║██╔══██╗    ██╔════╝██╔═══██╗████╗  ██║██║   ██║
██║  ███╗██████╔╝██║██║  ██║    ██║     ██║   ██║██╔██╗ ██║██║   ██║
██║   ██║██╔══██╗██║██║  ██║    ██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝
╚██████╔╝██║  ██║██║██████╔╝    ╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ 
 ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝  
```

## Overview

This task converts the inventory system from a 2D array storage structure with flexbox layout 
to a modern 1D array storage with CSS Grid layout. This change improves performance by 
eliminating nested loops and provides better control over item positioning for multi-slot items.

The conversion maintains the existing discriminated union type system while optimizing the 
underlying data structure and visual presentation. All existing functionality including 
drag-and-drop, multi-slot items, and hover effects will be preserved.

## Files to be Modified

### Core Store Files
- `/src/components/inventory/store/index.ts` - Grid creation and store state
- `/src/components/inventory/store/_actions.ts` - All action functions using array access
- `/src/components/inventory/types.ts` - Add 1D array type and utility functions

### Component Files  
- `/src/components/inventory/index.tsx` - Main grid component rendering
- `/src/components/inventory/InventorySlot.tsx` - Update props to use index
- `/src/components/inventory/styles.css` - Convert to CSS Grid layout

### Entity Trait Files
- `/src/entities/traits/inventory.ts` - Entity-level grid creation

## Conversion Diagram

```
BEFORE: 2D Array + Flexbox               AFTER: 1D Array + CSS Grid
┌─────────────────────────────┐          ┌─────────────────────────────┐
│ grid[row][col] Access       │          │ grid[index] Access          │
│                             │          │                             │
│ [0][0] [0][1] [0][2] [0][3] │   ───►   │ [0]  [1]  [2]  [3]         │
│ [1][0] [1][1] [1][2] [1][3] │          │ [4]  [5]  [6]  [7]         │
│ [2][0] [2][1] [2][2] [2][3] │          │ [8]  [9]  [10] [11]        │
│ [3][0] [3][1] [3][2] [3][3] │          │ [12] [13] [14] [15]        │
│                             │          │                             │
│ CSS: flex-direction: column │          │ CSS: display: grid          │
│      + flex for rows        │          │      grid-template-cols: 4  │
└─────────────────────────────┘          └─────────────────────────────┘

Utility Functions:
- rowColToIndex(row, col) -> index  
- indexToRowCol(index) -> {row, col}
```

## Implementation Strategy

### Phase 1: Utility Functions
Create index conversion utilities and update type definitions to support both patterns during migration.

### Phase 2: Store Conversion  
Update store creation and all action functions to use 1D array access with helper functions for row/col calculations.

### Phase 3: Component Updates
Convert main inventory component to render using CSS Grid and update InventorySlot to accept index instead of row/col.

### Phase 4: CSS Grid Layout
Replace flexbox-based grid system with CSS Grid for better multi-slot item positioning and cleaner layout code.

## Final Result

The inventory system will have improved performance through:
- Elimination of nested array loops (O(n²) → O(n))
- Cleaner slot access patterns  
- Better CSS Grid positioning for multi-slot items
- Maintained type safety with discriminated unions
- Preserved all existing drag-and-drop functionality

The visual presentation will remain identical while the underlying architecture becomes more efficient and maintainable.
