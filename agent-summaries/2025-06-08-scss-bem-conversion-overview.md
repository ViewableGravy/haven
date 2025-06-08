# SCSS & BEM CONVERSION OVERVIEW
```
  ____   ____   ____   ____      ___       _____   ______  __  __ 
 / ___| / ___| / ___| / ___|    ( _ )     | ____| |      ||  \/  |
 \___ \| |     \___ \| |___    / _ \/\   |  _|   | MMMM | |      |
  ___) | |___   ___) |\___  \  | (_>  <   | |___  | |\/| | | |\/| |
 |____/ \____| |____/  ___) |   \___/\/   |_____| |_|  |_| |_|  |_|
                      |____/                                        
  ____   ___   _   _ __     __  _____ ____   ____  ___ ___  _   _ 
 / ___| / _ \ | \ | |\ \   / / | ____| _ \ / ___|_ _/ _ \| \ | |
| |    | | | ||  \| | \ \ / /  |  _| |   / \___ \| | | | ||  \| |
| |___ | |_| || |\  |  \ V /   | |___| |\ \  ___) | | |_| || |\  |
 \____| \___/ |_| \_|   \_/    |_____|_| \_\|____/___\___/ |_| \_|
```

## High Level Overview

This task involves converting the existing CSS inventory system to SCSS with BEM (Block Element Modifier) naming convention. The current system uses traditional CSS class names like `inventory-panel`, `inventory-slot`, `item-icon`, etc. We need to restructure this to follow BEM methodology where components become blocks, sub-elements become elements, and states become modifiers.

The BEM naming pattern follows: `Block__element--modifier`. For example, `InventorySlot__item--hovered` represents the item element of the InventorySlot block in a hovered state. This will improve CSS maintainability, reduce naming conflicts, and create a clearer component hierarchy.

## Files to be Modified

### New Files
- `/src/components/inventory/styles.scss` - New SCSS file to replace the existing CSS
- `/package.json` - Add SCSS dependencies

### Modified Files
- `/src/components/inventory/index.tsx` - Update className references to use BEM naming
- `/src/components/inventory/InventorySlot.tsx` - Update className references to use BEM naming

### Removed Files
- `/src/components/inventory/styles.css` - Will be replaced by SCSS version

## Implementation Changes

### BEM Class Name Mapping
```
OLD CSS CLASS                 -> NEW BEM CLASS
inventory-panel              -> InventoryPanel
inventory-header             -> InventoryPanel__header
close-button                 -> InventoryPanel__close-button
inventory-content            -> InventoryPanel__content
inventory-grid               -> InventoryPanel__grid
inventory-slot               -> InventorySlot
inventory-slot.selected      -> InventorySlot--selected
inventory-slot.has-item      -> InventorySlot--has-item
inventory-slot.occupied      -> InventorySlot--occupied
inventory-slot.multi-slot-main -> InventorySlot--multi-slot-main
item-icon                    -> InventorySlot__item
item-icon.hovered            -> InventorySlot__item--hovered
item-quantity                -> InventorySlot__quantity
```

### SCSS Structure
The new SCSS file will be organized with:
1. InventoryPanel block with nested elements
2. InventorySlot block with nested elements and modifiers
3. CSS custom properties maintained for dynamic sizing
4. Hover effects and transitions preserved

## Technical Implementation

- Install `sass` as a dev dependency for Vite SCSS support
- Convert CSS to SCSS using nested structure matching BEM hierarchy
- Update React components to use new BEM class names
- Maintain all existing functionality including:
  - Item sizing with CSS custom properties
  - Hover effects and transitions
  - Multi-slot item support
  - Quantity display

## Final Notes

This conversion will improve code maintainability by establishing a clear naming convention that directly maps to component structure. The SCSS nesting will make the styles more readable and maintainable, while the BEM methodology will prevent CSS class conflicts and make the component hierarchy explicit in the class names.

All existing visual styling and functionality will be preserved - this is purely a structural refactor to improve code organization and follow modern CSS/SCSS best practices.
