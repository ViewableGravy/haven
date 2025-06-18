# PLAYER COLLISION DETECTION IMPLEMENTATION

```
██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗ 
██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

 ██████╗ ██████╗ ██╗     ██╗     ██╗███████╗██╗ ██████╗ ███╗   ██╗
██╔════╝██╔═══██╗██║     ██║     ██║██╔════╝██║██╔═══██╗████╗  ██║
██║     ██║   ██║██║     ██║     ██║███████╗██║██║   ██║██╔██╗ ██║
██║     ██║   ██║██║     ██║     ██║╚════██║██║██║   ██║██║╚██╗██║
╚██████╗╚██████╔╝███████╗███████╗██║███████║██║╚██████╔╝██║ ╚████║
 ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

## High Level Overview

This task implements basic collision detection for the player character to prevent walking through solid entities like trees and assemblers. The implementation leverages the existing collision detection infrastructure used by the MouseFollower system and integrates it directly into the player movement logic.

The system will check for collisions before applying movement deltas, preventing the player from moving into positions that would overlap with solid entities. This provides immediate tactile feedback and creates more realistic world interaction without complex physics simulation.

## Files to be Modified

### Core Player System:
- `src/utilities/player/index.ts` - Add collision detection to handleMovement method
- `src/objects/traits/transform.ts` - Add collision helper methods if needed

### Entity Configuration:
- `src/objects/spruceTree/base.ts` - Mark as solid/collideable (optional trait)
- `src/objects/assembler/base.ts` - Mark as solid/collideable (optional trait)

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLAYER MOVEMENT LOOP                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Calculate movement deltas from keyboard input          │ │
│  │  2. Create hypothetical new player position               │ │
│  │  3. Check collision with all solid entities               │ │
│  │  4. Apply movement only if no collision detected          │ │
│  │  5. Send multiplayer position updates                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COLLISION DETECTION SYSTEM                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  • Iterate through all entities in EntityManager          │ │
│  │  • Filter for entities with TransformTrait                │ │
│  │  • Use Rectangle.intersects for collision checking        │ │
│  │  • Support for solid entity identification                │ │
│  │  • Reuse existing MouseFollower collision logic           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SOLID ENTITIES                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  • Spruce Trees: 64x96 pixel collision box                │ │
│  │  • Assemblers: 128x128 pixel collision box                │ │
│  │  • Player: ~40x80 pixel collision box (2-tile height)     │ │
│  │  • Future entities can be easily added to system         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

The collision detection will be implemented as a simple method that:

1. **Pre-Movement Check**: Before applying movement deltas, calculate the theoretical new position
2. **Entity Iteration**: Loop through all entities from the EntityManager
3. **Transform Filter**: Only check entities that have TransformTrait (position + size)
4. **Rectangle Collision**: Use the existing Rectangle.intersects utility for collision detection
5. **Movement Prevention**: If collision detected, prevent movement in that direction

**Key Design Decisions:**
- Reuse existing collision infrastructure from MouseFollower system
- Simple rectangular collision boxes for performance
- No physics simulation - just prevent overlapping movement
- Support for per-axis collision (can slide along walls)
- Extensible design for future solid entity types

**Player Collision Box:**
- Width: ~40 pixels (slightly smaller than tile size for smooth movement)
- Height: ~80 pixels (2-tile character height)
- Anchor: Bottom-center matching sprite anchor

**Performance Considerations:**
- Collision checks run every frame during movement
- Entity iteration limited to ~50-100 entities per chunk typically
- Rectangle.intersects is highly optimized O(1) operation
- Early exit when collision detected

## Benefits

- **Immediate Feedback**: Player instantly feels solid world boundaries
- **Realistic Interaction**: Can't walk through trees and buildings
- **Extensible System**: Easy to add collision to new entity types
- **Performance Efficient**: Minimal impact on frame rate
- **Simple Implementation**: Leverages existing collision utilities

## Risk Assessment

**Low Risk:**
- Rectangle collision detection (well-tested utility)
- Player movement integration (isolated change)
- Performance impact (minimal computational overhead)

**Medium Risk:**
- Player getting stuck in geometry (edge case handling)
- Collision box sizing (may need fine-tuning)
- Multiplayer synchronization of blocked movement

**Mitigation Strategies:**
- Start with generous collision boxes and tune as needed
- Add debug visualization for collision boxes during development
- Test with various entity placements and player positions
- Ensure multiplayer position updates respect collision detection
