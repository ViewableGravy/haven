```
████████╗██╗    ██╗██╗ ██████╗        ██╗    ██╗██╗     ██╗██████╗ ██╗   ██╗ ██████╗██╗  ██╗
╚══██╔══╝██║    ██║██║██╔════╝        ██║    ██║██║     ██║██╔══██╗██║   ██║██╔════╝██║ ██╔╝
   ██║   ██║ █╗ ██║██║██║  ███╗       ██║ █╗ ██║██║     ██║██║  ██║██║   ██║██║     █████╔╝ 
   ██║   ██║███╗██║██║██║   ██║       ██║███╗██║██║     ██║██║  ██║██║   ██║██║     ██╔═██╗ 
   ██║   ╚███╔███╔╝██║╚██████╔╝       ╚███╔███╔╝██║     ██║██████╔╝╚██████╔╝╚██████╗██║  ██╗
   ╚═╝    ╚══╝╚══╝ ╚═╝ ╚═════╝         ╚══╝╚══╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝
                                                                                              
██╗███╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗ ██████╗ ██████╗ ██╗   ██╗                
██║████╗  ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝                
██║██╔██╗ ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝ ╚████╔╝                 
██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗  ╚██╔╝                  
██║██║ ╚████║ ╚████╔╝ ███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║   ██║                   
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝                   
                                                                                              
██╗████████╗███████╗███╗   ███╗███████╗                                                     
██║╚══██╔══╝██╔════╝████╗ ████║██╔════╝                                                     
██║   ██║   █████╗  ██╔████╔██║███████╗                                                     
██║   ██║   ██╔══╝  ██║╚██╔╝██║╚════██║                                                     
██║   ██║   ███████╗██║ ╚═╝ ██║███████║                                                     
╚═╝   ╚═╝   ╚══════╝╚═╝     ╚═╝╚══════╝                                                     
```

## Overview

This implementation adds two new inventory items to the Haven game: **Twig** (single-slot item) and **Duck** (2x1 multi-slot item). The project required extending the existing inventory system to support multi-slot items while maintaining backward compatibility with single-slot items. Both items are automatically added to the player's inventory when the game starts.

The multi-slot system introduces a sophisticated slot occupancy model where large items (like the duck) occupy their primary slot for the item data and mark adjacent slots as "occupied" with references back to the primary slot. This enables proper visual representation, interaction handling, and inventory management for items of different sizes.

## Files Modified

### New Item Classes
- `src/entities/items/twig.ts` - TwigItem class (single slot, stacks to 5)
- `src/entities/items/duck.ts` - DuckItem class (2x1 slot, stacks to 3)

### Core System Updates
- `src/entities/items/base.ts` - Added size property support for multi-slot items
- `src/components/inventory/types.ts` - Extended with ItemSize interface and occupiedBy slot property
- `src/components/inventory/store/_actions.ts` - Added multi-slot item placement, removal, and validation logic
- `src/components/inventory/store/index.ts` - Updated to initialize inventory with default twig and duck items

### UI Updates
- `src/components/inventory/InventorySlot.tsx` - Enhanced to handle occupied slots and multi-slot item display
- `src/components/inventory/styles.css` - Added styling for occupied slots and wide items

### Assets
- `public/assets/twig.svg` - SVG icon for twig item
- `public/assets/duck.svg` - SVG icon for duck item (displayed across 2 slots)

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY GRID (4x4)                        │
├─────────────────────────────────────────────────────────────────┤
│ [0,0] Twig      │ [0,1] Empty     │ [0,2] Empty     │ [0,3] Empty │
│ qty: 3          │                 │                 │             │
├─────────────────┼─────────────────┼─────────────────┼─────────────┤
│ [1,0] Duck      │ [1,1] Occupied  │ [1,2] Empty     │ [1,3] Empty │
│ qty: 1          │ by: slot-1-0    │                 │             │
│ size: 2x1       │                 │                 │             │
├─────────────────┼─────────────────┼─────────────────┼─────────────┤
│ [2,0] Empty     │ [2,1] Empty     │ [2,2] Empty     │ [2,3] Empty │
├─────────────────┼─────────────────┼─────────────────┼─────────────┤
│ [3,0] Empty     │ [3,1] Empty     │ [3,2] Empty     │ [3,3] Empty │
└─────────────────┴─────────────────┴─────────────────┴─────────────┘

Multi-Slot Item Flow:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Primary    │───▶│   Occupied   │───▶│   Display    │
│     Slot     │    │    Slots     │    │   Handling   │
│ (has item)   │    │(occupiedBy   │    │ (visual +    │
│              │    │ reference)   │    │ interaction) │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Implementation Details

### Multi-Slot Item System
The implementation uses a slot reference system where:
- **Primary Slot**: Contains the actual ItemStack data
- **Occupied Slots**: Contain `occupiedBy` references pointing to the primary slot ID
- **Visual Rendering**: The primary slot renders the item icon extended across occupied slots
- **Interaction**: Clicks on occupied slots redirect to the primary slot

### Key Functions Added
- `canPlaceMultiSlotItem()`: Validates if a multi-slot item can be placed at a position
- `placeMultiSlotItem()`: Places item and marks occupied slots
- `clearMultiSlotItem()`: Removes item and clears all occupied slots
- `getSlotPosition()`: Helper to convert slot ID to grid coordinates

### Default Inventory Setup
Both items are automatically added to the inventory on game initialization:
- Twig: Placed at [0,0] with quantity 3
- Duck: Placed at [1,0]-[1,1] (2x1) with quantity 1

The inventory can be toggled with the 'I' key, and items can be interacted with through clicking (selection) and double-clicking (usage/consumption). The visual design includes special styling for occupied slots with diagonal stripes and extended item icons for multi-slot items.
