```
███████╗███╗   ██╗████████╗██╗████████╗██╗   ██╗     ██████╗██╗     ███████╗ █████╗ ███╗   ██╗██╗   ██╗██████╗ 
██╔════╝████╗  ██║╚══██╔══╝██║╚══██╔══╝╚██╗ ██╔╝    ██╔════╝██║     ██╔════╝██╔══██╗████╗  ██║██║   ██║██╔══██╗
█████╗  ██╔██╗ ██║   ██║   ██║   ██║    ╚████╔╝     ██║     ██║     █████╗  ███████║██╔██╗ ██║██║   ██║██████╔╝
██╔══╝  ██║╚██╗██║   ██║   ██║   ██║     ╚██╔╝      ██║     ██║     ██╔══╝  ██╔══██║██║╚██╗██║██║   ██║██╔═══╝ 
███████╗██║ ╚████║   ██║   ██║   ██║      ██║       ╚██████╗███████╗███████╗██║  ██║██║ ╚████║╚██████╔╝██║     
╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝   ╚═╝      ╚═╝        ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     

███╗   ███╗███████╗███╗   ███╗ ██████╗ ██████╗ ██╗   ██╗    ██╗     ███████╗ █████╗ ██╗  ██╗
████╗ ████║██╔════╝████╗ ████║██╔═══██╗██╔══██╗╚██╗ ██╔╝    ██║     ██╔════╝██╔══██╗██║ ██╔╝
██╔████╔██║█████╗  ██╔████╔██║██║   ██║██████╔╝ ╚████╔╝     ██║     █████╗  ███████║█████╔╝ 
██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██║   ██║██╔══██╗  ╚██╔╝      ██║     ██╔══╝  ██╔══██║██╔═██╗ 
██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██║   ██║       ███████╗███████╗██║  ██║██║  ██╗
╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝       ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
```

## High Level Overview

A memory leak has been identified in the entity cleanup system during chunk unloading. When players move around and chunks are dynamically loaded/unloaded, entities within those chunks are not being properly cleaned up, causing memory usage to steadily increase over time.

The root cause is that while the visual containers and chunk references are properly destroyed during chunk unloading, the individual entities' traits are not being cleaned up. Specifically, traits like `ContextMenuTrait` maintain event listeners and cleanup functions that need to be explicitly called when entities are destroyed. The current system only removes visual containers and entity manager references but doesn't call trait-level destroy methods.

This creates a situation where PIXI event listeners, subscription callbacks, and other resources remain in memory even after entities are visually removed from the game world.

## Files That Will Be Modified

- `src/objects/base.ts` - Add entity-level destroy method that cleans up all traits
- `src/utilities/game/entityManager.ts` - Call entity destroy during cleanup
- `src/utilities/multiplayer/entitySync.ts` - Call entity destroy when removing entities
- `src/objects/spruceTree/base.ts` - Update custom destroy to call trait cleanup
- `src/objects/assembler/factory.tsx` - Add entity-level destroy method
- `src/objects/traits/contextMenu.ts` - Ensure proper cleanup (already implemented)

## Memory Leak Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CHUNK LOADING CYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                   │
│  │   Player    │───▶│   Chunk      │───▶│   Entities      │                   │
│  │   Moves     │    │   Loads      │    │   Created       │                   │
│  └─────────────┘    └──────────────┘    └─────────────────┘                   │
│         │                                         │                           │
│         ▼                                         ▼                           │
│  ┌─────────────┐                         ┌─────────────────┐                   │
│  │   Spruce    │                         │   Traits Add    │                   │
│  │   Trees     │                         │   Event         │                   │
│  │   Created   │                         │   Listeners     │                   │
│  └─────────────┘                         └─────────────────┘                   │
│                                                   │                           │
│                                                   ▼                           │
│                                          ┌─────────────────┐                   │
│                                          │  ContextMenu    │                   │
│                                          │  Sets Up        │                   │
│                                          │  Cleanup Funcs  │                   │
│                                          └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CHUNK UNLOADING CYCLE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                   │
│  │   Player    │───▶│   Chunk      │───▶│   PIXI          │                   │
│  │   Moves     │    │   Unloads    │    │   Containers    │                   │
│  │   Away      │    │              │    │   Destroyed ✅   │                   │
│  └─────────────┘    └──────────────┘    └─────────────────┘                   │
│         │                                         │                           │
│         ▼                                         ▼                           │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                   │
│  │  EntitySync │───▶│ Entity Refs  │───▶│   Traits NOT    │                   │
│  │  Cleanup    │    │ Removed ✅    │    │   Cleaned Up ❌  │                   │
│  └─────────────┘    └──────────────┘    └─────────────────┘                   │
│                                                   │                           │
│                                                   ▼                           │
│                                          ┌─────────────────┐                   │
│                                          │  MEMORY LEAK!   │                   │
│                                          │  Event          │                   │
│                                          │  Listeners      │                   │
│                                          │  Still Active   │                   │
│                                          └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Trait Cleanup Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CURRENT SYSTEM (LEAKY)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                   │
│  │   Entity    │───▶│   Visual     │───▶│   Container     │                   │
│  │   Removed   │    │   Cleanup    │    │   Destroyed     │                   │
│  └─────────────┘    └──────────────┘    └─────────────────┘                   │
│         │                                         ▲                           │
│         ▼                                         │                           │
│  ┌─────────────┐                                  │                           │
│  │   Traits    │──────────────────────────────────┘                           │
│  │   IGNORED   │  ❌ No cleanup called                                         │
│  └─────────────┘                                                               │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────┐                                                               │
│  │  Listeners  │  ❌ Still active in memory                                    │
│  │  Callbacks  │                                                               │
│  │  Resources  │                                                               │
│  └─────────────┘                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FIXED SYSTEM (CLEAN)                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐                   │
│  │   Entity    │───▶│  GameObject  │───▶│   Iterate       │                   │
│  │   Removed   │    │  .destroy()  │    │   All Traits    │                   │
│  └─────────────┘    └──────────────┘    └─────────────────┘                   │
│                              │                   │                           │
│                              ▼                   ▼                           │
│                     ┌──────────────┐    ┌─────────────────┐                   │
│                     │   Call       │───▶│   Trait         │                   │
│                     │   trait      │    │   .destroy()    │                   │
│                     │   .destroy() │    │   If Exists     │                   │
│                     └──────────────┘    └─────────────────┘                   │
│                              │                   │                           │
│                              ▼                   ▼                           │
│                     ┌──────────────┐    ┌─────────────────┐                   │
│                     │   Visual     │───▶│   All Resources │                   │
│                     │   Cleanup    │    │   Properly      │                   │
│                     │   (Existing) │    │   Cleaned ✅     │                   │
│                     └──────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Solution Implementation Strategy

**Phase 1: Add Generic Entity Destroy Method**
- Add a `destroy()` method to `GameObject` base class that iterates through all traits
- Call `trait.destroy()` if the method exists on each trait
- Ensure this is called before visual cleanup in entity removal scenarios

**Phase 2: Update Entity Cleanup Locations**
- Modify `EntityManager.removeEntity()` to call entity destroy
- Update `EntitySyncManager.handleRemoteEntityRemoved()` to call entity destroy
- Ensure chunk unloading calls entity destroy before removing containers

**Phase 3: Standardize Trait Destroy Methods**
- Ensure all traits that need cleanup have a `destroy()` method
- Update existing entity destroy methods to call the new generic approach
- Remove trait-specific cleanup from individual entity classes

## Implementation Details

### GameObject Base Class Enhancement
```typescript
public destroy(): void {
  // Iterate through all traits and call destroy if it exists
  Object.values(this.traits).forEach(trait => {
    if (trait && typeof trait.destroy === 'function') {
      trait.destroy();
    }
  });
  
  // Clear trait references
  this.traits = {};
}
```

### Trait Destroy Pattern
All traits that manage resources should implement:
```typescript
public destroy(): void {
  // Clean up event listeners
  // Clear subscriptions
  // Remove external references
  // Clear internal state
}
```

## Risk Assessment

**Low Risk:**
- Adding generic destroy method to GameObject (non-breaking)
- Updating existing entity cleanup calls (follows existing patterns)
- ContextMenuTrait already has proper destroy implementation

**Medium Risk:**
- Ensuring all entity removal paths call the new destroy method
- Timing of destroy calls to avoid double-cleanup scenarios

**Mitigation Strategies:**
- Add destroy safety checks to prevent double-cleanup
- Test memory usage with chunk loading/unloading cycles
- Add logging to track entity lifecycle for debugging
- Ensure existing custom destroy methods still work

## Success Criteria

1. **Memory Stability**: Memory usage remains stable during extended chunk loading/unloading
2. **No Leaks**: Event listeners and subscriptions are properly cleaned up
3. **Backward Compatibility**: Existing entity functionality continues to work
4. **Performance**: No degradation in chunk loading/unloading speed
5. **Clean Architecture**: All entities follow consistent cleanup patterns
