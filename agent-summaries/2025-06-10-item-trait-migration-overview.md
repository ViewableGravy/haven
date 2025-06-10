# ITEM TRAIT MIGRATION OVERVIEW
# =============================
#  _____ _____ _____ __  __    _____  ___   _____  _____ _____ 
# |_   _|_   _|  ___|  \/  |  |_   _|| _ \ |  _  ||_   _|_   _|
#   | |   | | | |__ | |\/| |    | |  |   / |     |  | |   | |  
#   | |   | | |  __|| |  | |    | |  |   \ |  _  |  | |   | |  
#   |_|   |_| |_|   |_|  |_|    |_|  |_|\_\|_| |_|  |_|   |_|  
#                                                              
#  __  __ ___  ___  ___  ___  _____ ___ ___  _  _ 
# |  \/  |_ _|/ __|/ _ \|_ _||_   _|_ _/ _ \| \| |
# | |\/| || || (_ | |_) || |   | |  | | |_) | .` |
# |_|  |_|___|\___| .__/|___|  |_| |___\___/|_|\_|
#                 |_|                            

## High-Level Overview

This implementation migrates the item system from using abstract BaseItem classes to a trait-based system
that leverages GameObjects with an ItemTrait. This change aligns items with the existing entity architecture,
enabling items to benefit from the robust trait system while maintaining full compatibility with the 
inventory system.

The migration transforms items from standalone data objects into full GameObjects that can have multiple
traits (item, transform, container, etc.), opening up possibilities for advanced item features like
visual representations, placement in the world, and complex interactions.

## Files That Will Be Modified

### Core System Changes:
- `src/objects/traits/types.ts` - Add ItemTrait to trait definitions
- `src/objects/traits/item.ts` - New ItemTrait implementation  
- `src/objects/traits/index.ts` - Export ItemTrait

### Item System Migration:
- `src/objects/items/base.ts` - Remove BaseItem class and helper functions, add documentation
- `src/objects/items/stick.ts` - Convert to GameObject with ItemTrait
- `src/objects/items/twig.ts` - Convert to GameObject with ItemTrait
- `src/objects/items/duck.ts` - Convert to GameObject with ItemTrait
- `src/objects/items/fishingrod.ts` - Convert to GameObject with ItemTrait
- `src/objects/items/largebox.ts` - Convert to GameObject with ItemTrait

### Factory Functions:
- `src/objects/items/factory.ts` - New item factory functions

### Inventory Integration:
- `src/components/inventory/types.ts` - Update Item interface to reference GameObjects
- `src/objects/traits/inventory.ts` - Update to work with GameObject items

## Migration Pattern

### Before (BaseItem System):
```typescript
export abstract class BaseItem implements InventoryNamespace.Item {
  constructor(
    public readonly id: string,
    public readonly name: string,
    // ... other properties
  ) {}
  
  abstract use(): void;
  abstract canStackWith(otherItem: InventoryNamespace.Item): boolean;
}

export class StickItem extends BaseItem {
  constructor() {
    super("stick", "Stick", "A simple wooden stick", "/assets/stick.png");
  }
  
  use() { /* implementation */ }
  canStackWith(other) { return other instanceof StickItem; }
}
```

### After (GameObject + ItemTrait System):
```typescript
export class ItemTrait {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly iconPath: string,
    public readonly maxStackSize: number = 5,
    public readonly weight: number = 1,
    public readonly rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" = "common",
    public readonly size?: InventoryNamespace.ItemSize
  ) {}
  
  use(): void { /* default implementation */ }
  canStackWith(otherItem: GameObject): boolean { /* default implementation */ }
}

export function createStickItem(): GameObject {
  const item = new GameObject({ name: "stick-item" });
  item.addTrait('item', new ItemTrait(
    "stick", "Stick", "A simple wooden stick", "/assets/stick.png"
  ));
  return item;
}
```

## Implementation Strategy

1. **Create ItemTrait**: Implement new trait with item-specific functionality
2. **Update Trait Types**: Add ItemTrait to the trait system type definitions
3. **Convert Item Classes**: Transform each BaseItem subclass to factory function
4. **Clean Up Base System**: Remove redundant helper functions, use ItemTrait static methods directly
5. **Update Inventory Types**: Modify InventoryNamespace.Item to work with GameObjects
6. **Update Inventory System**: Ensure inventory trait works with GameObject items
6. **Update Usage Sites**: Find and update all item creation/usage locations
7. **Validate Compatibility**: Ensure inventory UI and interactions still work

## Key Benefits

- **Consistency**: Items now use the same architecture as all other game entities ✅
- **Extensibility**: Items can have multiple traits (transform for world placement, container for storage, etc.) ✅
- **Type Safety**: Better type checking through the trait system ✅
- **Performance**: Unified entity management system ✅
- **Direct API Access**: Using ItemTrait static methods directly eliminates wrapper function overhead ✅
- **Clean Architecture**: No barrel files or redundant re-exports ✅

## Migration Complete ✅

**Status**: SUCCESSFULLY COMPLETED

The item trait migration has been fully implemented and tested:

### ✅ Completed Tasks:
1. **ItemTrait Implementation** - Complete trait system with all item functionality
2. **Factory Pattern** - All items use GameObject factory functions
3. **Inventory Integration** - Seamless compatibility with existing inventory UI
4. **Helper Function Cleanup** - Removed redundant wrapper functions
5. **Barrel File Removal** - Eliminated unnecessary re-export files
6. **Build Verification** - All TypeScript compilation and builds successful
7. **API Simplification** - Direct access to ItemTrait static methods

### 🗂️ Final File Structure:
- `src/objects/items/factory.ts` - Single source for all item creation
- `src/objects/items/base.ts` - Legacy BaseItem class + documentation
- `src/objects/traits/item.ts` - ItemTrait implementation
- Individual item files removed (stick.ts, twig.ts, duck.ts, fishingrod.ts, largebox.ts)

### 🔄 Usage Pattern:
```typescript
// Create items using factory functions
import { createStickItem, createDuckItem } from "src/objects/items/factory";
const stick = createStickItem();

// Use ItemTrait static methods directly
import { ItemTrait } from "src/objects/traits/item";
const itemData = ItemTrait.getInventoryItem(stick);
const canStack = ItemTrait.canStackWith(item1, item2);
```

## Final State

Items are now full GameObjects that:
- ✅ Store in inventories (via ItemTrait)
- ✅ Maintain inventory UI compatibility 
- ✅ Use the unified GameObject architecture
- ✅ Have clean, direct API access
- ✅ Support future extensibility with additional traits
- ✅ Build and run without errors

This establishes a robust, clean foundation for advanced item features while maintaining full backward compatibility with the existing inventory system.
