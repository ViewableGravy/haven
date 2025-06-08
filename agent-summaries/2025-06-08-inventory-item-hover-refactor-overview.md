```
██╗███╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗ ██████╗ ██████╗ ██╗   ██╗
██║████╗  ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
██║██╔██╗ ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝ ╚████╔╝ 
██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗  ╚██╔╝  
██║██║ ╚████║ ╚████╔╝ ███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║   ██║   
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

██╗  ██╗ ██████╗ ██╗   ██╗███████╗██████╗     ██████╗ ███████╗███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ 
██║  ██║██╔═══██╗██║   ██║██╔════╝██╔══██╗    ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
███████║██║   ██║██║   ██║█████╗  ██████╔╝    ██████╔╝█████╗  █████╗  ███████║██║        ██║   ██║   ██║██████╔╝
██╔══██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗    ██╔══██╗██╔══╝  ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗
██║  ██║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║    ██║  ██║███████╗██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║
╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
```

## High Level Overview

This refactor improves the inventory system by:
1. Moving hover effects from individual slots to the actual items (covering multiple slots)
2. Moving main slot calculation logic into the store for better performance and consistency
3. Adding item-level hover detection that highlights the entire item as a single unit

Currently, when hovering over a multi-slot item, each slot highlights individually. After this refactor,
hovering over any part of a multi-slot item will highlight the entire item as one cohesive unit, providing
a much better user experience and visual clarity.

## Files to be Modified

1. `src/components/inventory/types.ts` - Add main slot metadata to slot type
2. `src/components/inventory/store/_actions.ts` - Update slot creation to include main slot info
3. `src/components/inventory/InventorySlot.tsx` - Simplify component by removing main slot logic
4. `src/components/inventory/styles.css` - Update CSS for item-level hover effects
5. `src/components/inventory/store/index.ts` - Update grid creation to set main slot metadata

## Architecture Changes

```
Before:
InventorySlot Component
├── Calculates main slot on every render
├── Individual slot hover states
└── Slot-level styling

After:
Store
├── Pre-calculates main slot during item placement
├── Stores main slot metadata in each slot
└── Item-level hover state tracking

InventorySlot Component  
├── Reads pre-calculated main slot data
├── Item-level hover detection
└── Unified item styling
```

## Implementation Strategy

1. **Type Updates**: Add `isMainSlot` boolean and `mainSlotId` string to slot interface
2. **Store Updates**: Modify item placement functions to set main slot metadata
3. **Component Simplification**: Remove runtime main slot calculation from component
4. **CSS Enhancement**: Create item-level hover effects using CSS selectors
5. **Hover Logic**: Update hover detection to work at item level rather than slot level

## Benefits

- **Performance**: Eliminates runtime main slot calculations on every component render
- **UX**: Provides cohesive item highlighting for multi-slot items
- **Maintainability**: Centralizes main slot logic in the store where it belongs
- **Visual Clarity**: Single border around entire items instead of fragmented slot borders

This refactor follows the single responsibility principle by moving data calculation logic
to the store layer and keeping the component focused purely on rendering and user interaction.
