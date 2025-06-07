```
  _____ _   _ _   _ _____ _   _ _____ _____ ______   __
 |_   _| \ | | | | |  ___| \ | |_   _|  _  || ___ \ \ / /
   | | |  \| | | | | |__ |  \| | | | | | | || |_/ /  \ / 
   | | | . ` | | | |  __|| . ` | | | | | | ||    /    \ \ 
  _| |_| |\  \ \_/ / |___| |\  | | | \ \_/ /| |\ \    | |
  \___/\_| \_/\___/\____/\_| \_/ \_/  \___/ \_| \_|   \_/
                                                         
   _____ _   _ _____ _____ _____ ___  ___                
  /  ___| | | /  ___|_   _|  ___/  |/  /                
  \ `--.| | | \ `--.  | | | |__ `  .  '                 
   `--. \ | | |`--. \ | | |  __||  |\/  |               
  /\__/ / |_| /\__/ / | | | |___| |  | |               
  \____/ \___/\____/  \_/ \____/\_|  |_/               
```

## High-Level Overview

This implementation adds a comprehensive inventory system to the player character, enabling item storage, management, and interaction with the game world. The system introduces the concept of "items" as distinct from "entities" - where entities are placed objects in the world, items are collectible resources that can be stored in inventory slots.

The inventory system follows a trait-based architecture, consistent with the existing codebase patterns, and provides a grid-based storage interface with stack management capabilities.

## Files to be Modified/Created

### New Files:
- `src/entities/traits/inventory.ts` - Core inventory trait implementation
- `src/components/inventory/index.tsx` - Main inventory panel component  
- `src/components/inventory/InventorySlot.tsx` - Individual slot component
- `src/components/inventory/InventoryGrid.tsx` - Grid layout component
- `src/components/inventory/store.ts` - Inventory state management
- `src/components/inventory/styles.css` - Inventory panel styling
- `src/components/inventory/types.ts` - Inventory-specific type definitions
- `src/entities/items/base.ts` - Base item class and interfaces
- `src/entities/items/types.ts` - Item type definitions
- `src/entities/items/stick.ts` - Example stick item implementation

### Modified Files:
- `src/App.tsx` - Add inventory panel to UI
- `src/entities/base.ts` - Add item drop functionality
- `src/entities/spruceTree/factory.tsx` - Add stick dropping on interaction

## System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Player Entity │    │ Inventory Trait │    │ Inventory Panel │
│                 │◄───┤                 │◄───┤                 │
│ - Has Inventory │    │ - 4x4 Grid      │    │ - Floating UI   │
│ - Can Interact  │    │ - Stack Size: 5 │    │ - Drag & Drop   │
└─────────────────┘    │ - Add/Remove    │    │ - Visual Slots  │
         │              └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │ Inventory Store │              │
         └──────────────┤                 │──────────────┘
                        │ - Global State  │
                        │ - Persistence   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Item System   │
                        │                 │
                        │ - Base Item     │
                        │ - Item Types    │
                        │ - Stack Logic   │
                        └─────────────────┘
```

## Implementation Details

The inventory system will be implemented as a trait that can be attached to any entity (primarily the player). Items are distinct from entities - they represent collectible resources that can be stored, stacked, and managed within the inventory grid.

Key features include:
- 4x4 grid layout with 16 total slots
- Stack size limit of 5 items per slot
- Floating panel UI that can be toggled open/closed
- Drag and drop functionality for item management
- Integration with entity interaction system for item collection
- Example implementation with stick items from spruce trees

The system follows the existing codebase patterns with proper separation of concerns, trait-based architecture, and React component structure with Zustand state management.
