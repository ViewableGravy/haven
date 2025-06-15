# Layer System & Y-Based Sorting Implementation

```
 _                              ____            _                   
| |    __ _ _   _  ___ _ __     / ___| _   _ ___| |_ ___ _ __ ___  
| |   / _` | | | |/ _ \ '__|    \___ \| | | / __| __/ _ \ '_ ` _ \ 
| |__| (_| | |_| |  __/ |        ___) | |_| \__ \ ||  __/ | | | | |
|_____\__,_|\__, |\___|_|       |____/ \__, |___/\__\___|_| |_| |_|
            |___/                      |___/                      
     __   __     ____                 _                       
     \ \ / /    | __ )  __ _ ___  ___ __| |                      
      \ V /____ |  _ \ / _` / __|/ _ \/ _` |                      
       | |______| |_) | (_| \__ \  __/ (_| |                      
       |_|       |____/ \__,_|___/\___|\__,_|                      
  ____             _   _                 
 / ___|  ___  _ __| |_(_)_ __   __ _ 
 \___ \ / _ \| '__| __| | '_ \ / _` |
  ___) | (_) | |  | |_| | | | | (_| |
 |____/ \___/|_|   \__|_|_| |_|\__, |
                               |___/ 
```

## High Level Overview

This refactor implements a proper layer-based rendering system for the Haven game to solve z-index complexity and ensure proper depth sorting. Currently, entities have hardcoded z-index values which creates maintenance issues and doesn't properly handle depth sorting.

The new system creates two main layers:
1. **Background Layer** (z-index: -10) - Contains all chunk background rendering
2. **Entity Layer** (z-index: 0) - Contains all entities and the player, with automatic y-position based depth sorting

This eliminates the need for hardcoded z-index values on individual entities and provides natural depth sorting where entities with higher y-coordinates (lower on screen) render in front of entities with lower y-coordinates (higher on screen).

## Files to be Modified

- `src/utilities/game/game.ts` - Add layer containers to the main game stage
- `src/utilities/game/world.ts` - Update chunk background rendering to use background layer  
- `src/utilities/world/createWorldObject.ts` - Update entity creation to use entity layer
- `src/objects/spruceTree/base.ts` - Remove hardcoded z-index, add to entity layer
- `src/objects/assembler/base.ts` - Remove hardcoded z-index, add to entity layer
- `src/objects/traits/container.ts` - Remove hardcoded z-index from containers
- `src/utilities/game/player.ts` - Move player to entity layer with y-based sorting
- `src/utilities/layers/index.ts` - New layer management system
- `src/utilities/layers/types.ts` - Layer type definitions

## System Architecture

```
Game Stage
├── Background Layer (z-index: -10)
│   ├── Chunk Background 1
│   ├── Chunk Background 2
│   └── ...
└── Entity Layer (z-index: 0, sortableChildren: true)
    ├── Entity A (z-index based on y-position)
    ├── Entity B (z-index based on y-position)  
    ├── Player (z-index based on y-position)
    └── ...
```

**Y-Position to Z-Index Formula:**
```typescript
zIndex = Math.floor(yPosition)
```

Entities with higher y-coordinates (lower on screen) will have higher z-index values, making them render in front of entities with lower y-coordinates (higher on screen).

## Implementation Details

The layer system will:
- Create global layer containers managed by a LayerManager
- Move all chunk background rendering to the background layer
- Move all entities and the player to the entity layer
- Automatically update entity z-index when y-position changes
- Remove all hardcoded z-index values from entity components
- Enable sortableChildren on the entity layer for automatic depth sorting
- Provide utility functions for adding/removing objects from layers

## Benefits

1. **Automatic Depth Sorting**: No more manual z-index management
2. **Performance**: Efficient layer-based rendering with PIXI's sortableChildren
3. **Maintainability**: Single source of truth for depth ordering
4. **Scalability**: Easy to add new layer types in the future
5. **Visual Correctness**: Proper depth perception based on world coordinates
