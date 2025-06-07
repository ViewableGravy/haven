```
 ███████╗███╗   ██╗████████╗██╗████████╗██╗   ██╗
 ██╔════╝████╗  ██║╚══██╔══╝██║╚══██╔══╝╚██╗ ██╔╝
 █████╗  ██╔██╗ ██║   ██║   ██║   ██║    ╚████╔╝ 
 ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║     ╚██╔╝  
 ███████╗██║ ╚████║   ██║   ██║   ██║      ██║   
 ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝   ╚═╝      ╚═╝   
                                                   
 ██╗   ██╗███╗   ██╗██╗███████╗██╗ ██████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
 ██║   ██║████╗  ██║██║██╔════╝██║██╔════╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
 ██║   ██║██╔██╗ ██║██║█████╗  ██║██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║
 ██║   ██║██║╚██╗██║██║██╔══╝  ██║██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
 ╚██████╔╝██║ ╚████║██║██║     ██║╚██████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
  ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

# Entity System Unification Overview

## High Level Overview

The current entity system maintains an artificial distinction between "remote" entities (those that came from the server) and "normal" entities (locally placed ones). This distinction creates unnecessary complexity throughout the codebase, introduces potential synchronization issues, and makes the system harder to reason about.

The primary issue is that an entity's origin (server-generated vs locally-placed) shouldn't affect how it's managed once it exists in the game world. All entities should be treated uniformly regardless of their source. The current dual-tracking system creates edge cases in chunk loading/unloading, multiplayer synchronization, and entity lifecycle management.

This refactor will eliminate the remote/local entity distinction by unifying all entities under a single management system while preserving the ability to track entity metadata (like who placed it) for game logic purposes.

## Files That Will Be Modified

### Core Entity System
- `src/entities/base.ts` - Remove `isRemoteEntity` flag, simplify entity creation
- `src/utilities/game/entityManager.ts` - Unify entity tracking, remove remote-specific logic
- `src/utilities/multiplayer/entitySync.ts` - Remove `remoteEntities` Map, simplify sync logic

### Entity Registration & Creation
- `src/utilities/multiplayer/entitySyncRegistry.ts` - Simplify entity creation interface
- Various entity factory files - Update creation patterns to be uniform

### Event Handlers
- `src/utilities/multiplayer/events/entity_placed.ts` - Unify placement handling
- `src/utilities/multiplayer/events/entity_removed.ts` - Unify removal handling
- `src/utilities/multiplayer/events/entities_list.ts` - Simplify bulk sync

### Manager Classes
- `src/utilities/multiplayer/manager.ts` - Simplify event routing
- `src/systems/chunkManager/` - Remove special remote entity handling

## Entity Management Unification Diagram

```
CURRENT SYSTEM (COMPLEX):
┌─────────────────────────────────────────────────────────────────────────┐
│                        EntityManager                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ entities: Set<BaseEntity>          ┌─────────────────────────────────────┤
│ entitiesByChunk: Map<...>          │        EntitySyncManager            │
└─────────────────────────────────────┼─────────────────────────────────────┤
                                     │ remoteEntities: Map<string, Entity> │
                                     │ queuedEntities: EntityData[]        │
                                     └─────────────────────────────────────┤
                                                                           │
┌──────────────────────────┬─────────────────────────────────────────────┤
│    BaseEntity            │                                             │
├──────────────────────────┤              PROBLEMS:                      │
│ isRemoteEntity: boolean  │        • Dual tracking systems              │
│ multiplayerId?: string   │        • Complex sync logic                 │
│ placedBy?: string        │        • Chunk unload edge cases            │
└──────────────────────────┤        • Memory leak potential              │
                           └─────────────────────────────────────────────┤

UNIFIED SYSTEM (SIMPLE):
┌─────────────────────────────────────────────────────────────────────────┐
│                        EntityManager                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ entities: Set<BaseEntity>                                               │
│ entitiesByChunk: Map<ChunkKey, Set<BaseEntity>>                         │
│ entityMetadata: Map<string, EntityMetadata>  // Optional tracking       │
└─────────────────────────────────────────────────────────────────────────┤
                                                                           │
┌──────────────────────────┬─────────────────────────────────────────────┤
│    BaseEntity            │                                             │
├──────────────────────────┤              BENEFITS:                      │
│ uid: string              │        • Single source of truth             │
│ multiplayerId?: string   │        • Simplified sync logic              │
│ placedBy?: string        │        • Easier chunk management            │
│ (no isRemoteEntity)      │        • Reduced memory overhead            │
└──────────────────────────┤        • Cleaner API surface                │
                           └─────────────────────────────────────────────┤
```

## Implementation Strategy

**Phase 1: Entity Manager Unification**
- Remove `remoteEntities` Map from `EntitySyncManager`
- Merge all entity tracking into `EntityManager.entities`
- Update entity placement to go through unified system

**Phase 2: Remove Remote Entity Flag**
- Remove `isRemoteEntity` from `BaseEntity`
- Update entity placement listener to use metadata instead of flags
- Simplify entity creation in `EntitySyncRegistry`

**Phase 3: Cleanup & Optimization**
- Remove unused remote-specific methods
- Consolidate event handling logic
- Update chunk loading/unloading to work with unified system

**Phase 4: Testing & Validation**
- Test entity placement (both local and server-generated)
- Verify multiplayer synchronization still works correctly
- Test chunk loading/unloading with entities
- Ensure no memory leaks or duplicate entities

## Final Implementation Details

The unified system will maintain all the same functionality but with a cleaner architecture:

1. **Single Entity Store**: All entities live in `EntityManager.entities` regardless of origin
2. **Metadata Tracking**: Entity origin and placement info stored as metadata, not behavioral flags
3. **Simplified Sync**: `EntitySyncManager` handles server communication without separate tracking
4. **Unified Events**: Entity placement/removal events work the same for all entities
5. **Cleaner Chunk Management**: No special cases for "remote" entities during chunk operations

This change will eliminate the current complexity around remote vs local entities while maintaining all existing functionality and improving the overall system reliability.
