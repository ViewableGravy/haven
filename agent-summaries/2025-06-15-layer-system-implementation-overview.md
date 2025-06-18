# LAYER SYSTEM IMPLEMENTATION OVERVIEW

```
██╗      █████╗ ██╗   ██╗███████╗██████╗     ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
██║     ███████║ ╚████╔╝ █████╗  ██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
███████╗██║  ██║   ██║   ███████╗██║  ██║    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
```

## High Level Overview

This task implements a proper rendering layer system for the game to ensure correct visual depth sorting and
separation of concerns between background and entity rendering. Currently, entities and backgrounds are mixed
together with hardcoded z-index values, causing visual inconsistencies and making depth management difficult.

The new system creates two distinct rendering layers: a background layer (z-index -10) for all chunk/terrain
rendering, and an entity layer (z-index 0) for all game entities including the player. Within the entity layer,
automatic z-index sorting is based on y-position, ensuring entities further down appear in front of entities
further up, creating proper depth perception.

## Files to be Modified

- `src/utilities/game/world.ts` - Create and manage the layer containers
- `src/utilities/world/createWorldObject.ts` - Update entity creation to use entity layer
- `src/utilities/game/game.ts` - Initialize layer system in game setup
- `src/objects/player/Player.tsx` - Move player to entity layer with y-based sorting
- `src/objects/spruceTree/factory.tsx` - Remove hardcoded z-index, use entity layer
- `src/objects/assembler/factory.tsx` - Remove hardcoded z-index, use entity layer
- `src/objects/traits/container.ts` - Update container trait to use entity layer
- `src/utilities/world/chunkGeneration.ts` - Move chunk background to background layer
- `src/utilities/multiplayer/entitySync.ts` - Update entity sync to work with layers
- `src/types/rendering.ts` - New file for layer system types

## System Architecture Diagram

```
PIXI Application
├── Background Layer (z-index: -10)
│   ├── Chunk Backgrounds
│   ├── Terrain Sprites
│   └── Ground Tiles
│
└── Entity Layer (z-index: 0)
    ├── Player (y-based z-index)
    ├── Trees (y-based z-index)
    ├── Assemblers (y-based z-index)
    ├── Items (y-based z-index)
    └── Other Entities (y-based z-index)

Y-Position Sorting within Entity Layer:
- Lower Y = Lower z-index (appears behind)
- Higher Y = Higher z-index (appears in front)
```

## Implementation Details

The layer system will be implemented through a centralized layer manager that creates and maintains two primary
containers. All chunk background rendering will be moved to the background layer, while all entities (including
the player) will be placed on the entity layer. The entity layer will implement automatic y-position-based sorting
to ensure proper depth perception without manual z-index management.

Entity factories and creation utilities will be updated to automatically place new entities on the correct layer,
and existing hardcoded z-index values will be removed. The sorting system will continuously update entity z-indexes
based on their y-position, ensuring dynamic depth sorting as entities move around the world.
