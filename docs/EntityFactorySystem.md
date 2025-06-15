# 🏭 Entity Factory System

The Entity Factory System provides a unified approach to creating and managing game entities with consistent APIs across all entity types. This system handles both local (client-only) and networked (server-synchronized) entity creation.

## Overview

Each entity type defines its own factory using the `createFactory` utility, which generates three standardized methods:

- **`createLocal`** - Creates local entities (no server synchronization)
- **`createNetworked`** - Creates networked entities (synchronized with server via API)
- **`createNetworkedFromLocal`** - Converts existing local entities to networked

## Architecture

### 1. Factory Definition

Each entity defines its factory in its corresponding factory file:

```typescript
// src/objects/spruceTree/factory.tsx
import { createFactory } from "../../utilities/createFactory";
import type { NetworkSyncConfig } from "../../objects/traits/network";

const SpruceTreeNetworkConfig: NetworkSyncConfig = {
  syncTraits: ['position', 'placeable'],
  syncFrequency: 'batched',
  priority: 'normal',
  persistent: true
};

export const spruceTreeFactory = createFactory({
  factoryFn: createStandardSpruceTree,
  network: SpruceTreeNetworkConfig
});
```

### 2. Global Registry

All factories are exposed through the `WorldObjects` registry:

```typescript
// src/worldObjects.ts
import { assemblerFactory } from "./objects/assembler";
import { spruceTreeFactory } from "./objects/spruceTree/factory";

export const WorldObjects = {
  assembler: assemblerFactory,
  spruceTree: spruceTreeFactory,
} as const;
```

### 3. Usage Patterns

```typescript
import { WorldObjects } from "../worldObjects";

// Create local entities (no server sync)
const localSpruce = WorldObjects.spruceTree.createLocal(game, { x: 100, y: 200 });
const localAssembler = WorldObjects.assembler.createLocal(game, { x: 300, y: 400 });

// Create networked entities (server sync with API requests)
const networkedSpruce = await WorldObjects.spruceTree.createNetworked(game, { x: 100, y: 200 });
const networkedAssembler = await WorldObjects.assembler.createNetworked(game, { x: 300, y: 400 });

// Convert local entities to networked
const converted = await WorldObjects.spruceTree.createNetworkedFromLocal(localSpruce, game);
```

## Network Synchronization

### Local Entities
- Created instantly on the client
- No server communication
- Useful for previews, temporary objects, and UI elements
- Can be converted to networked entities later

### Networked Entities
- Make API requests to the server for creation
- Server validates and responds with `entity_placed` websocket event
- Automatically synchronized with other clients
- Include NetworkTrait for ongoing state synchronization

### Conversion Process
1. Extract position and properties from local entity
2. Remove local entity from the game world
3. Request networked entity creation from server
4. Server creates and broadcasts to all clients

## Network Configuration

Each entity type defines its synchronization behavior:

```typescript
const NetworkConfig: NetworkSyncConfig = {
  syncTraits: ['position', 'placeable'],  // Which traits sync to server
  syncFrequency: 'batched',               // How often to sync ('immediate' | 'batched')
  priority: 'normal',                     // Sync priority ('high' | 'normal' | 'low')
  persistent: true                        // Whether entity persists on server
};
```

## Benefits

- **Consistency**: All entities use the same factory API
- **Type Safety**: Full TypeScript support with proper typing
- **Server-First**: Networked entities always validated by server
- **Flexibility**: Easy conversion between local and networked entities
- **Maintainability**: Centralized factory logic with minimal boilerplate

## Implementation Guide

### Adding a New Entity Type

1. **Create the base factory function**:
   ```typescript
   export function createStandardMyEntity(game: Game, opts: { position: Position }): MyEntity {
     // Entity creation logic
     return entity;
   }
   ```

2. **Define network configuration**:
   ```typescript
   const MyEntityNetworkConfig: NetworkSyncConfig = {
     syncTraits: ['position', 'placeable'],
     syncFrequency: 'batched',
     priority: 'normal',
     persistent: true
   };
   ```

3. **Create and export the factory**:
   ```typescript
   export const myEntityFactory = createFactory({
     factoryFn: createStandardMyEntity,
     network: MyEntityNetworkConfig
   });
   ```

4. **Add to WorldObjects registry**:
   ```typescript
   export const WorldObjects = {
     myEntity: myEntityFactory,
     // ... other entities
   } as const;
   ```

### Error Handling

```typescript
try {
  const entity = await WorldObjects.spruceTree.createNetworked(game, { x, y });
  console.log("Entity created successfully:", entity.uid);
} catch (error) {
  console.error("Failed to create networked entity:", error);
  // Fallback to local entity if needed
  const localEntity = WorldObjects.spruceTree.createLocal(game, { x, y });
}
```

The factory system provides a robust, scalable foundation for entity management that supports both single-player and multiplayer gameplay scenarios.
