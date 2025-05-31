```
███████╗██████╗ ██████╗ ██╗   ██╗ ██████╗███████╗    ████████╗██████╗ ███████╗███████╗
██╔════╝██╔══██╗██╔══██╗██║   ██║██╔════╝██╔════╝    ╚══██╔══╝██╔══██╗██╔════╝██╔════╝
███████╗██████╔╝██████╔╝██║   ██║██║     █████╗         ██║   ██████╔╝█████╗  █████╗  
╚════██║██╔═══╝ ██╔══██╗██║   ██║██║     ██╔══╝         ██║   ██╔══██╗██╔══╝  ██╔══╝  
███████║██║     ██║  ██║╚██████╔╝╚██████╗███████╗       ██║   ██║  ██║███████╗███████╗
╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝       ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝

███████╗███╗   ██╗████████╗██╗████████╗██╗   ██╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
██╔════╝████╗  ██║╚══██╔══╝██║╚══██╔══╝╚██╗ ██╔╝    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
█████╗  ██╔██╗ ██║   ██║   ██║   ██║    ╚████╔╝     ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
██╔══╝  ██║╚██╗██║   ██║   ██║   ██║     ╚██╔╝      ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
███████╗██║ ╚████║   ██║   ██║   ██║      ██║       ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝   ╚═╝      ╚═╝       ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
```

## High Level Overview

This implementation creates a complete spruce tree entity system integrated with the existing server-driven chunk generation and hotbar placement systems. The system includes a new spruce tree sprite sheet, entity factory, server-side random generation within chunks, multiplayer synchronization, and hotbar integration for manual placement.

The key innovation is extending the existing entity framework to support decorative/environmental entities that can be both server-generated and player-placed. This creates a foundation for procedural content generation while maintaining full player control through the hotbar system. The spruce trees will randomly spawn in chunks based on noise generation and persist across multiplayer sessions.

## Files to be Modified

- `src/spriteSheets/spruceTree.ts` - New spruce tree sprite sheet configuration and loader
- `src/entities/spruceTree/factory.tsx` - New spruce tree entity factory and component
- `src/entities/spruceTree/info.tsx` - Spruce tree infographic component  
- `src/server/chunkGenerator.ts` - Add spruce tree generation to chunk creation
- `src/server/types.ts` - Add spruce tree entity type definitions
- `src/components/hotbar/store.ts` - Update hotbar to include spruce tree at index 2
- `src/utilities/game/game.ts` - Add spruce tree sprite loading to game initialization

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SERVER CHUNK GENERATION                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Generate terrain tiles with meadow sprites                             │ │
│  │  2. Use secondary noise layer for spruce tree placement                    │ │
│  │  3. Generate 0-3 spruce trees per chunk at random positions                │ │
│  │  4. Add tree entities to chunk data before sending to client               │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT CHUNK CREATION                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Receive chunk data with tiles and entities                             │ │
│  │  2. Create chunk background from tile sprite data                          │ │
│  │  3. Process entity data and create spruce tree entities                    │ │
│  │  4. Place trees in chunk using EntitySyncManager                           │ │
│  │  5. Add trees to chunk container and entity manager                        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             HOTBAR INTEGRATION                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Register spruce tree in infographics registry                          │ │
│  │  2. Add to hotbar at index 2 (keyboard shortcut: "2" key)                  │ │
│  │  3. Enable ghost mode placement with mouse follower                        │ │
│  │  4. Sync placement across multiplayer clients                              │ │
│  │  5. Persist placed trees in server chunk database                          │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Sprite Sheet Configuration

**Spruce Tree Sprite (spruce-tree.png):**
- Single sprite asset (estimated size based on existing assets)
- Tree height: ~128-196 pixels (2-3 tiles tall for natural scale)
- Tree width: ~64-96 pixels (1-1.5 tiles wide)
- Anchor point: Bottom center for natural ground placement
- z-index: Higher than terrain, lower than player for proper layering

## Implementation Details

**Server Changes:**
- Add spruce tree entity type to server types
- Implement random tree generation in ServerChunkGenerator using secondary noise
- Generate 0-3 trees per chunk based on noise thresholds
- Add tree entities to chunk data before sending to clients
- Ensure tree positions don't overlap and are within chunk boundaries

**Client Changes:**
- Create SpruceTreeSprite class following existing sprite patterns
- Implement BaseSpruceTree entity with Container, Ghostable, and Placeable traits
- Register spruce tree factory in entity sync registry for multiplayer
- Add spruce tree to infographics registry for hotbar integration
- Ensure proper z-index layering (background < trees < player)

**Entity Factory:**
- Small transform size (1x2 tiles for natural proportions)
- Selection sprite for hover interactions  
- Interactive sprite for click handling
- Ghost mode support for placement preview
- Placeable trait for hotbar placement system

**Hotbar Integration:**
- Register spruce tree infographic with creator function
- Automatically appears at index 1 (after assembler) in hotbar
- Supports keyboard shortcut "2" for quick selection
- Mouse follower system for placement preview

## Performance Considerations

**Memory Efficiency:** Single sprite asset loaded once, instanced for all trees
**Render Performance:** Trees use Container trait for efficient batching
**Generation Speed:** Secondary noise lookup adds ~0.1ms per chunk
**Network Efficiency:** Tree entities sent with initial chunk data, no additional requests

## Risk Assessment

**Low Risk:**
- Sprite asset loading (follows established patterns)
- Entity factory creation (based on assembler template)
- Hotbar integration (uses existing infographics system)

**Medium Risk:**
- Server-side random generation (may need balance tuning)
- Z-index layering with existing sprites
- Multiplayer synchronization of generated vs placed trees

**Mitigation Strategies:**
- Start with conservative tree generation rates (0-2 per chunk)
- Test z-index values to ensure proper visual layering
- Use existing entity sync patterns for consistency
- Add server-side validation for tree placement positions
