```
 ███████╗███╗   ██╗████████╗██╗████████╗██╗   ██╗    ██████╗ ██╗   ██╗ ██████╗ 
 ██╔════╝████╗  ██║╚══██╔══╝██║╚══██╔══╝╚██╗ ██╔╝    ██╔══██╗██║   ██║██╔════╝ 
 █████╗  ██╔██╗ ██║   ██║   ██║   ██║    ╚████╔╝     ██████╔╝██║   ██║██║  ███╗
 ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║     ╚██╔╝      ██╔══██╗██║   ██║██║   ██║
 ███████╗██║ ╚████║   ██║   ██║   ██║      ██║       ██████╔╝╚██████╔╝╚██████╔╝
 ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝   ╚═╝      ╚═╝       ╚═════╝  ╚═════╝  ╚═════╝ 
```

## High Level Overview

The issue is a **entity cleanup/synchronization problem** in the chunk unloading system. When chunks are unloaded due to player movement, entities within those chunks are being removed from the `EntitySyncManager.remoteEntities` Map but NOT from the server's chunk database. When the player returns to the chunk, the server sends the entities again, but the `EntitySyncManager` has already forgotten about them and thinks they're new entities.

The core problem is that **chunk unloading only cleans up client-side entity tracking** but doesn't properly coordinate with the multiplayer entity synchronization system. The `EntityManager.removeEntitiesForChunk()` method only removes the local chunk-to-entity mapping, but the `EntitySyncManager` still maintains its own `remoteEntities` Map which gets corrupted when entities are visually removed during chunk unloading.

## Root Cause Analysis

1. **New Chunk Load**: Server generates entities (e.g., spruce trees) and stores them in chunk database
2. **Client Receives Entities**: `EntitySyncManager.handleRemoteEntityPlaced()` creates entities and adds them to `remoteEntities` Map
3. **Player Moves Away**: `ChunkUnloadingManager` triggers `ChunkManager.unloadChunk()`
4. **Chunk Unload Issue**: 
   - `ChunkManager.unloadChunk()` removes chunk visually and calls `EntityManager.removeEntitiesForChunk()`
   - BUT `EntitySyncManager.remoteEntities` Map still contains the entity references
   - The visual containers are destroyed, but the entity tracking remains in memory
5. **Player Returns**: Server sends same entities again from database
6. **Duplicate Prevention**: `EntitySyncManager.handleRemoteEntityPlaced()` sees entity ID already exists in `remoteEntities` Map and skips creation
7. **Result**: No entities appear because they were never properly cleaned up from the entity sync system

## Files That Need to be Modified

- `src/systems/chunkManager/index.ts` - Fix chunk unloading to properly notify entity sync
- `src/utilities/multiplayer/entitySync.ts` - Add chunk unload cleanup method
- `src/utilities/game/entityManager.ts` - Enhance entity removal to work with entity sync

## Entity Lifecycle Fix Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT (BROKEN) FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │   Chunk     │───▶│   Entities   │───▶│  EntitySync     │                │
│  │   Loads     │    │   Created    │    │  Tracks Them    │                │
│  └─────────────┘    └──────────────┘    └─────────────────┘                │
│         │                                         │                        │
│         ▼                                         ▼                        │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │   Player    │───▶│   Chunk      │───▶│  EntitySync     │                │
│  │   Moves     │    │  Unloads     │    │  ORPHANED!      │                │
│  └─────────────┘    └──────────────┘    └─────────────────┘                │
│         │                                         │                        │
│         ▼                                         ▼                        │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │   Player    │───▶│   Server     │───▶│  EntitySync     │                │
│  │  Returns    │    │ Sends Same   │    │ Blocks Dupe     │                │
│  └─────────────┘    └──────────────┘    └─────────────────┘                │
│                                                   │                        │
│                                                   ▼                        │
│                                          ┌─────────────────┐                │
│                                          │  NO ENTITIES   │                │
│                                          │   VISIBLE!     │                │
│                                          └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             FIXED FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │   Chunk     │───▶│   Entities   │───▶│  EntitySync     │                │
│  │   Loads     │    │   Created    │    │  Tracks Them    │                │
│  └─────────────┘    └──────────────┘    └─────────────────┘                │
│         │                                         │                        │
│         ▼                                         ▼                        │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │   Player    │───▶│   Chunk      │───▶│  EntitySync     │                │
│  │   Moves     │    │  Unloads +   │    │  CLEANS UP      │                │
│  └─────────────┘    └──────────────┘    └─────────────────┘                │
│                     │ Notifies     │                                       │
│                     │ EntitySync   │                                       │
│         │           └──────────────┘                                       │
│         ▼                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │   Player    │───▶│   Server     │───▶│  EntitySync     │                │
│  │  Returns    │    │ Sends Same   │    │ Creates Fresh   │                │
│  └─────────────┘    └──────────────┘    └─────────────────┘                │
│                                                   │                        │
│                                                   ▼                        │
│                                          ┌─────────────────┐                │
│                                          │   ENTITIES     │                │
│                                          │   VISIBLE!     │                │
│                                          └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Solution Implementation Strategy

**Phase 1: Add Chunk Unload Notification**
- Modify `ChunkManager.unloadChunk()` to notify `EntitySyncManager` before cleanup
- Add `EntitySyncManager.handleChunkUnload()` method to clean up entity references

**Phase 2: Entity Reference Cleanup**
- Enhance `EntitySyncManager` to properly remove entities from `remoteEntities` Map when chunks unload
- Ensure visual cleanup and memory cleanup are synchronized

**Phase 3: Testing & Validation**
- Test the full cycle: load chunk → place entities → move away → return
- Verify entities reappear correctly when returning to previously visited chunks

## Risk Assessment

**Low Risk:**
- Adding notification mechanism (follows existing event patterns)
- Entity cleanup logic (straightforward Map operations)

**Medium Risk:**
- Timing coordination between chunk unload and entity cleanup
- Ensuring no memory leaks from orphaned entity references

**Mitigation Strategies:**
- Add comprehensive logging to track entity lifecycle
- Implement entity reference counting for debugging
- Test with multiple chunk load/unload cycles
- Add safeguards against double-cleanup

## Success Criteria

1. **Persistence**: Entities appear in newly generated chunks
2. **Revisit**: Entities reappear when returning to previously visited chunks  
3. **Memory**: No entity reference leaks in `EntitySyncManager.remoteEntities`
4. **Performance**: No degradation in chunk loading/unloading speed
5. **Multiplayer**: Entity synchronization remains stable across all clients
