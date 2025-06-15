# 🌐 Multiplayer Networking System

The Networking System provides server-authoritative multiplayer functionality with automatic synchronization, entity management, and real-time communication between clients and the server.

## Overview

The system uses a server-first architecture where the server maintains the authoritative game state, validates all actions, and broadcasts changes to connected clients. This ensures consistency and prevents cheating while providing a smooth multiplayer experience.

## Architecture Components

### 1. Server (Bun WebSocket Server)

The server manages the authoritative game state:

```typescript
// Server handles entity creation
server.handleEntityPlace = async (entityType, x, y, chunkX, chunkY, clientId) => {
  // Validate placement
  if (!isValidPlacement(entityType, x, y)) {
    return { success: false, error: "Invalid placement" };
  }

  // Create entity in server state
  const entity = createServerEntity(entityType, x, y, clientId);
  
  // Broadcast to all clients
  broadcast('entity_placed', {
    id: entity.id,
    type: entityType,
    x, y,
    placedBy: clientId
  });

  return { success: true, entityId: entity.id };
};
```

### 2. Client (WebSocket Connection)

Clients connect to the server and handle bi-directional communication:

```typescript
// Client sends entity creation request
const result = await multiplayer.client.sendEntityPlaceAsync(
  'spruce-tree', 
  x, y, 
  chunkX, chunkY
);

// Client receives entity placement from server
multiplayer.on('entity_placed', (entityData) => {
  entitySyncManager.handleRemoteEntityPlaced(entityData);
});
```

### 3. Entity Synchronization

Automatic synchronization of entity state across clients:

```typescript
// NetworkTrait handles trait synchronization
const networkTrait = new NetworkTrait(entity, game, {
  syncTraits: ['position', 'placeable'],
  syncFrequency: 'batched',
  priority: 'normal'
});

// Position changes automatically sync to server
entity.getTrait('position').setPosition(newX, newY);
// ↓ NetworkTrait detects change and syncs to server
// ↓ Server validates and broadcasts to other clients
```

## Network Flow

### Entity Creation Flow

```
Client Request → Server Validation → Server State Update → Broadcast to All Clients
```

1. **Client Initiates**: `WorldObjects.spruceTree.createNetworked(game, { x, y })`
2. **API Request**: Client sends `entity_place` message to server
3. **Server Validation**: Server validates placement and creates entity
4. **Server Response**: Server responds with success/failure
5. **Broadcast**: Server broadcasts `entity_placed` to all connected clients
6. **Client Sync**: All clients receive and create the entity locally

### Entity State Synchronization

```
Local Change → NetworkTrait → Server Update → Broadcast → Remote Clients
```

1. **Local Modification**: Player moves an entity
2. **Trait Detection**: NetworkTrait detects position change
3. **Server Sync**: Change sent to server based on sync frequency
4. **Server Validation**: Server validates the change
5. **Broadcast**: Server broadcasts change to other clients
6. **Remote Update**: Other clients update their local entities

## Message Types

### Client → Server

```typescript
// Entity creation
{
  type: 'entity_place',
  requestId: 'unique-id',
  entityType: 'spruce-tree',
  x: 100,
  y: 200,
  chunkX: 0,
  chunkY: 0
}

// Entity trait update
{
  type: 'entity_trait_update',
  entityId: 'entity-123',
  traitName: 'position',
  traitData: { x: 150, y: 250 }
}
```

### Server → Client

```typescript
// Entity placement confirmation
{
  type: 'entity_placed',
  id: 'entity-123',
  type: 'spruce-tree',
  x: 100,
  y: 200,
  placedBy: 'client-456'
}

// Entity trait synchronization
{
  type: 'entity_trait_sync',
  entityId: 'entity-123',
  traitName: 'position',
  traitData: { x: 150, y: 250 }
}
```

## Network Configuration

### Sync Frequency Options

```typescript
type SyncFrequency = 'immediate' | 'batched';

// Immediate: Changes sync instantly (high bandwidth, low latency)
{
  syncTraits: ['position'],
  syncFrequency: 'immediate'
}

// Batched: Changes batched and sent periodically (lower bandwidth)
{
  syncTraits: ['position', 'placeable'],
  syncFrequency: 'batched'  // Default batching interval: 100ms
}
```

### Priority Levels

```typescript
type Priority = 'high' | 'normal' | 'low';

// High: Critical changes (player actions, important events)
// Normal: Regular gameplay changes (entity movements)
// Low: Cosmetic changes (animations, effects)
```

## Client-Side Implementation

### Multiplayer Client

```typescript
export class MultiplayerClient {
  private ws: WebSocket;
  private pendingRequests: Map<string, PendingRequest> = new Map();

  // Async request with promise-based response
  public async sendEntityPlaceAsync(
    entityType: string,
    x: number,
    y: number,
    chunkX: number,
    chunkY: number
  ): Promise<EntityPlaceResponse> {
    const requestId = generateUniqueId();
    
    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Send request
      this.ws.send(JSON.stringify({
        type: 'entity_place',
        requestId,
        entityType,
        x, y, chunkX, chunkY
      }));

      // Timeout after 10 seconds
      setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }
}
```

### Entity Sync Manager

```typescript
export class EntitySyncManager {
  // Handle incoming entity placement from server
  public async handleRemoteEntityPlaced(entityData: EntityData): Promise<void> {
    // Map server entity type to local factory
    const factory = WorldObjects[entityData.type];
    
    // Create entity using server data (no entity creation sync)
    const entity = factory.createFromServer(this.game, {
      x: entityData.x,
      y: entityData.y
    });

    // Set as remote entity
    entity.setAsRemoteEntity(entityData.id, entityData.placedBy);
    
    // Place in world
    this.placeEntityInMainStage(entity, entityData);
  }
}
```

## Server-Side Implementation

### WebSocket Handler

```typescript
export class WebSocketHandler {
  // Handle entity placement requests
  private async handleEntityPlace(ws: WebSocket, data: any): Promise<void> {
    const { requestId, entityType, x, y, chunkX, chunkY } = data;
    
    try {
      // Validate placement
      const validation = await this.validateEntityPlacement(entityType, x, y);
      if (!validation.valid) {
        this.sendError(ws, requestId, validation.error);
        return;
      }

      // Create entity in server state
      const entity = await this.createServerEntity(entityType, x, y, ws.clientId);

      // Respond to requesting client
      this.sendSuccess(ws, requestId, { entityId: entity.id });

      // Broadcast to all clients
      this.broadcastEntityPlaced(entity);
      
    } catch (error) {
      this.sendError(ws, requestId, error.message);
    }
  }
}
```

## Error Handling

### Network Failures

```typescript
try {
  const entity = await WorldObjects.spruceTree.createNetworked(game, { x, y });
  console.log("Entity created successfully");
} catch (error) {
  if (error.message === 'Request timeout') {
    // Server didn't respond in time
    console.warn("Server response timeout, creating local entity");
    const localEntity = WorldObjects.spruceTree.createLocal(game, { x, y });
    // Could retry conversion later
  } else {
    // Other network error
    console.error("Failed to create networked entity:", error);
  }
}
```

### Connection Management

```typescript
// Automatic reconnection
client.on('disconnect', () => {
  console.log("Disconnected from server, attempting reconnection...");
  setTimeout(() => {
    client.reconnect();
  }, 5000);
});

// Connection state checking
if (!client.isConnected()) {
  console.warn("Not connected to server, creating local entity");
  return WorldObjects.spruceTree.createLocal(game, { x, y });
}
```

## Performance Optimization

### Batching

```typescript
// Batch multiple trait updates
const batcher = new TraitUpdateBatcher();
batcher.addUpdate(entityId, 'position', { x: 100, y: 200 });
batcher.addUpdate(entityId, 'rotation', { angle: 45 });
batcher.flush(); // Sends batched updates
```

### Culling

```typescript
// Only sync entities within player view distance
const shouldSync = (entity: GameObject, playerPosition: Position): boolean => {
  const distance = calculateDistance(entity.position, playerPosition);
  return distance <= SYNC_DISTANCE_THRESHOLD;
};
```

### Compression

```typescript
// Compress position data for network transmission
const compressPosition = (x: number, y: number): CompressedPosition => {
  return {
    x: Math.round(x * 100) / 100, // 2 decimal places
    y: Math.round(y * 100) / 100
  };
};
```

## Security Considerations

### Server Validation

- All client requests validated on server
- Movement speed limits enforced
- Placement rules verified
- Resource constraints checked

### Anti-Cheat

- Server maintains authoritative state
- Client predictions validated
- Unusual patterns detected and flagged
- Rate limiting on actions

The networking system provides a robust foundation for real-time multiplayer gameplay with automatic synchronization, error handling, and performance optimization.
