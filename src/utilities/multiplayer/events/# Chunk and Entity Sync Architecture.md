# DO NOT USE!!!


# Chunk and Entity Sync Architecture (Suggestion)

## Overview

This architecture separates **individual entity operations** (position-based) from **complete chunk operations** (chunk-based with embedded entities). This prevents timing issues while maintaining clean separation of concerns.

## Core Principles

1. **EntitySyncManager**: Handles individual entity placement/removal at world positions
2. **ChunkSyncManager**: Handles complete chunk data from server (terrain + entities atomically)
3. **No Race Conditions**: Chunks and entities are created together as a single operation
4. **Server Authority**: Complete server chunks override local generation

## Data Flow Diagrams

### Entity Operations Flow
```
Client Action → EntitySyncManager → EntityManager → Notify Server
Server Event → MultiplayerManager → EntitySyncManager → EntityManager
```

### Chunk Operations Flow
```
Server Chunk Data → MultiplayerManager → ChunkSyncManager → ChunkManager + EntityManager (atomic)
Local Chunk Request → ChunkManager → Check ChunkSyncManager → Generate or Use Server Data
```

## Pseudo Code Structure

### 1. Server Protocol

```typescript
// Server sends complete chunk data in one message
interface ServerChunkData {
  x: number;
  y: number;
  terrain: TerrainData;
  entities: EntityData[];
  isComplete: boolean; // Indicates authoritative chunk data
}

interface EntityData {
  id: string;
  type: string;
  x: number;
  y: number;
  properties?: Record<string, any>;
}
```

### 2. ChunkSyncManager (NEW)

```typescript
class ChunkSyncManager {
  private game: Game;
  private serverChunkData: Map<string, ServerChunkData>;

  /***** CORE RESPONSIBILITIES *****/
  // 1. Store incoming server chunk data
  // 2. Create chunks atomically with entities
  // 3. Coordinate with ChunkManager for loading

  handleServerChunkData(chunkData: ServerChunkData): void {
    // Store complete server chunk data
    storeChunkData(chunkData);
    
    // If chunk is actively needed, create it immediately
    if (chunkShouldBeLoaded(chunkData.x, chunkData.y)) {
      createChunkFromServerData(chunkData);
    }
  }

  private createChunkFromServerData(chunkData: ServerChunkData): void {
    // ATOMIC OPERATION:
    // 1. Create chunk (terrain)
    chunk = chunkManager.createChunkFromServerData(chunkData.terrain);
    
    // 2. Create all entities in chunk
    entities = chunkData.entities.map(entityData => 
      entityManager.createEntityInChunk(entityData, markAsServerEntity: true)
    );
    
    // 3. Register complete chunk with entities
    chunkManager.registerChunkWithEntities(chunk, entities);
  }

  hasServerDataForChunk(chunkX: number, chunkY: number): boolean;
  loadChunkWithServerData(chunkX: number, chunkY: number): Promise<void>;
}
```

### 3. Updated EntitySyncManager

```typescript
class EntitySyncManager {
  private game: Game;
  private remoteEntities: Map<string, Entity>;

  /***** WORLD POSITION API *****/
  // "I don't care about chunks" API
  placeEntityAtWorldPosition(entityType: string, worldX: number, worldY: number): void {
    // EntityManager automatically determines chunk placement
    entity = entityManager.placeEntityAtWorldPosition(entityType, {x: worldX, y: worldY});
    
    // Notify server of placement (world coordinates)
    notifyServerEntityPlaced(entity, worldX, worldY);
  }

  /***** REMOTE ENTITY HANDLING *****/
  handleRemoteEntityPlaced(entityData: EntityData): void {
    // Server tells us about entity at world position
    // EntityManager figures out which chunk it belongs to
    entity = entityManager.createEntityFromServer(entityData);
    remoteEntities.set(entityData.id, entity);
  }

  handleRemoteEntityRemoved(data: {id: string}): void {
    entity = remoteEntities.get(data.id);
    if (entity) {
      entityManager.removeEntity(entity);
      remoteEntities.delete(data.id);
    }
  }
}
```

### 4. Updated ChunkManager Integration

```typescript
class ChunkManager {
  /***** CHUNK LOADING WITH SERVER INTEGRATION *****/
  loadChunk(chunkX: number, chunkY: number): Promise<void> {
    chunkKey = createChunkKey(chunkX, chunkY);
    
    // Check if we have server data for this chunk
    if (chunkSyncManager.hasServerDataForChunk(chunkX, chunkY)) {
      // Use server data (includes entities atomically)
      return chunkSyncManager.loadChunkWithServerData(chunkX, chunkY);
    } else {
      // Generate locally (no entities from server)
      return generateLocalChunk(chunkX, chunkY);
    }
  }

  /***** SERVER CHUNK CREATION *****/
  createChunkFromServerData(chunkX: number, chunkY: number, terrainData: TerrainData): Chunk {
    // Create chunk from server terrain data
    chunk = new Chunk(chunkX, chunkY);
    chunk.applyTerrainData(terrainData);
    return chunk;
  }

  registerChunkWithEntities(chunkKey: string, chunk: Chunk, entities: Entity[]): void {
    // Atomically register chunk and its entities
    chunks.set(chunkKey, chunk);
    emit('chunkLoaded', { chunk, entities, source: 'server' });
  }
}
```

### 5. Updated MultiplayerManager

```typescript
class MultiplayerManager {
  public entitySync: EntitySyncManager;
  public chunkSync: ChunkSyncManager; // ADD THIS

  constructor(game: Game, localPlayer: Player) {
    this.entitySync = new EntitySyncManager(game);
    this.chunkSync = new ChunkSyncManager(game); // ADD THIS
    setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Individual entity operations
    client.on('entity_placed', (data) => entitySync.handleRemoteEntityPlaced(data));
    client.on('entity_removed', (data) => entitySync.handleRemoteEntityRemoved(data));
    
    // Complete chunk operations
    client.on('chunk_data', (data) => chunkSync.handleServerChunkData(data)); // ADD THIS
  }
}
```

## Implementation Strategy

### Phase 1: Create ChunkSyncManager
```typescript
// 1. Create new ChunkSyncManager class
// 2. Add basic server chunk data storage
// 3. Implement hasServerDataForChunk() method
```

### Phase 2: Integrate with ChunkManager
```typescript
// 1. Update ChunkManager.loadChunk() to check for server data
// 2. Add createChunkFromServerData() method
// 3. Add registerChunkWithEntities() method
```

### Phase 3: Add to MultiplayerManager
```typescript
// 1. Add ChunkSyncManager instance to MultiplayerManager
// 2. Add 'chunk_data' event handler
// 3. Wire up event routing
```

### Phase 4: Implement Atomic Chunk Creation
```typescript
// 1. Implement createChunkFromServerData() in ChunkSyncManager
// 2. Ensure entities are created with server authority markers
// 3. Test atomic chunk + entity creation
```

## Benefits

1. **No Timing Issues**: Chunks and entities created atomically
2. **Server Authority**: Complete chunks override local generation
3. **Clean APIs**: EntitySync for position-based, ChunkSync for chunk-based
4. **Fallback Support**: Local generation when no server data available
5. **Future Proof**: Easy to extend for more complex chunk operations

## Usage Examples

### Individual Entity Placement
```typescript
// Client wants to place entity at world position (doesn't care about chunks)
multiplayerManager.entitySync.placeEntityAtWorldPosition('tree', 1250, 780);
```

### Server Chunk Loading
```typescript
// Server sends complete chunk with entities
server.sendChunkData({
  x: 5, 
  y: 3,
  terrain: terrainData,
  entities: [
    {id: 'entity1', type: 'tree', x: 1250, y: 780},
    {id: 'entity2', type: 'rock', x: 1300, y: 800}
  ],
  isComplete: true
});
```