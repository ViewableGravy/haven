# CONTEXT MENU TRAIT IMPLEMENTATION

```
 ____  ___  _   _ _____ _____ __  __ _____   __  __ _____ _   _ _   _ 
/  __ \|  \| ||_   _|  ___/  \/  |_   _|  |  \/  |  ___| \ | | | | |
| /  \|   ` |  | | | |__ |\  /\  / | |    |       | |__ |  \| | | | |
| |    | |\  |  | | |  __||  \/  |  | |    | |\/| |  __|| . ` | | | |
| \__/\| | \ |  | | | |___\      /  | |    | |  | | |___| |\  | |_| |
 \____/|_|  \_|  |_| \____/ \/\/   |_|    |_|  |_\____/|_| \_|____/ 
                                                                    
_____ ____      _    ___ _____   _____ ______   _______ _____ __  __ 
|_   _| __) /\  |  | |_   _|   / ____|  ____| |__   __|  ___/  \/  |
  | | |   \/  \|  |   | |    / (___| |__       | |  | |__ |\  /\  /
  | | |  _/ /\ |  |   | |     \___ \  __|      | |  |  __||  \/  | 
  | | | | / ____ \  |  | |___ ____) | |___     | |  | |___\      / 
  |_| |_|/_/    \_\_|  |_____|_____/|_____|    |_|  \____/ \/\/  
```

## High Level Overview

This implementation creates a new `ContextMenuTrait` that can be added to any world object to provide 
right-click context menu functionality. The context menu is built entirely with PixiJS containers, 
graphics, and text elements to ensure it follows world transforms and maintains proper z-ordering 
with game objects.

The trait manages its own state for menu visibility and handles all event listeners directly on the 
container. When right-clicked, it creates a floating menu with configurable options that can execute 
callback functions. The implementation avoids React components to prevent transform and z-index issues.

## Files That Will Be Modified

### Core Trait System
- `src/objects/traits/contextMenu.ts` - New ContextMenuTrait implementation
- `src/objects/traits/types.ts` - Add ContextMenuTrait to trait definitions
- `src/objects/traits/index.ts` - Export ContextMenuTrait

### Entity Integration  
- `src/objects/spruceTree/factory.tsx` - Add contextMenuTrait to spruce tree

### Type System
- `src/objects/traits/contextMenu.ts` - Context menu specific types and interfaces

## Implementation Architecture

```
ContextMenuTrait Architecture:
┌─────────────────────────────────────────────────────────────────┐
│                      ContextMenuTrait                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Constructor Config:                                            │
│  ├── entity: GameObject                                         │
│  ├── options: Array<ContextMenuOption>                         │
│  └── containerTrait: ContainerTrait                            │
│                                                                 │
│  Menu State:                                                    │
│  ├── isOpen: boolean                                            │
│  ├── menuContainer: Container | null                           │
│  └── cleanup functions                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Event Handling                             │ │
│  │                                                             │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │ │
│  │  │ Right Click │───▶│ Show Menu   │───▶│ Position at │     │ │
│  │  │ Detection   │    │ Container   │    │ Cursor      │     │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘     │ │
│  │                                               │             │ │
│  │                                               ▼             │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │ │
│  │  │ Click Away  │───▶│ Hide Menu   │───▶│ Cleanup     │     │ │
│  │  │ Detection   │    │ Container   │    │ Resources   │     │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘     │ │
│  │                                               │             │ │
│  │                                               ▼             │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │ │
│  │  │ Menu Item   │───▶│ Execute     │───▶│ Close Menu  │     │ │
│  │  │ Click       │    │ Callback    │    │ & Cleanup   │     │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Menu Structure

The context menu will be created using pure PixiJS components:

```
Context Menu Container:
├── Background Graphics (rounded rectangle)
├── Menu Items (Text + Interactive Areas)
│   ├── Item 1: "Twig" → callback()
│   ├── Item 2: "Branch" → callback()
│   └── ... (configurable options)
└── Border Graphics (visual styling)
```

## Key Benefits

- **World Transform Compatibility**: Uses PixiJS containers that follow world transforms
- **No React Dependencies**: Avoids React component transform issues  
- **Proper Z-Index Handling**: Menu appears above game objects in world space
- **Configurable Options**: Easy to add different menu items per entity
- **Event Management**: Self-contained event listener management
- **Performance**: Lightweight PixiJS-only implementation

## Final Implementation Result

This implementation will provide:
- **Right-click context menus** for any world object using the trait
- **Configurable menu options** with labels and callback actions
- **Proper world positioning** that follows game transforms and zoom
- **Self-contained state management** without global state dependencies
- **Example integration** with spruce tree showing "twig" and "branch" options
- **Extensible foundation** for adding context menus to other entities

The system maintains compatibility with the existing trait architecture while providing 
a robust, reusable context menu system for enhancing world object interactions.
