# 🌍 World and Chunk System

The World and Chunk System manages the game world through a procedurally generated, infinite world divided into manageable chunks. This system handles terrain generation, entity placement, and performance optimization through dynamic loading and unloading.

## Overview

The world is divided into fixed-size chunks that are generated on-demand as players explore. Each chunk contains terrain data and can host entities, but entities are managed independently of chunks for improved performance and simplified cleanup.

## Architecture

### 1. World Structure

```
Infinite World
├── Chunk (0,0)    ├── Chunk (1,0)    ├── Chunk (2,0)
├── Chunk (0,1)    ├── Chunk (1,1)    ├── Chunk (2,1)
├── Chunk (0,2)    ├── Chunk (1,2)    ├── Chunk (2,2)
```

Each chunk:
- Fixed size (e.g., 512x512 pixels)
- Contains terrain sprites and background
- Independent loading/unloading
- Procedurally generated based on world seed

### 2. Coordinate Systems

**Chunk Coordinates**: Grid-based chunk positioning
```typescript
const chunkX = Math.floor(worldX / CHUNK_SIZE);
const chunkY = Math.floor(worldY / CHUNK_SIZE);
const chunkKey = `${chunkX},${chunkY}`;
```

**World Coordinates**: Absolute pixel positions
```typescript
const worldX = 1500; // Absolute world position
const worldY = 800;
```

**Local Coordinates**: Position within a chunk
```typescript
const localX = worldX % CHUNK_SIZE;
const localY = worldY % CHUNK_SIZE;
```

## Chunk Management

### 1. Chunk Generation

```typescript
export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private generator: ChunkGenerator;

  public async generateChunk(chunkX: number, chunkY: number): Promise<Chunk> {
    const chunkKey = `${chunkX},${chunkY}`;
    
    if (this.chunks.has(chunkKey)) {
      return this.chunks.get(chunkKey)!;
    }

    // Generate terrain data
    const terrainData = await this.generator.generateTerrain(chunkX, chunkY);
    
    // Create chunk with terrain sprites
    const chunk = new Chunk(chunkX, chunkY, terrainData);
    
    // Add to chunk cache
    this.chunks.set(chunkKey, chunk);
    
    return chunk;
  }
}
```

### 2. Dynamic Loading

Chunks are loaded based on player proximity:

```typescript
export class WorldManager {
  private loadedChunks: Set<string> = new Set();
  private readonly LOAD_RADIUS = 2; // Load chunks within 2 chunk radius

  public updatePlayerPosition(playerX: number, playerY: number): void {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const playerChunkY = Math.floor(playerY / CHUNK_SIZE);

    // Determine chunks that should be loaded
    const requiredChunks = this.getRequiredChunks(playerChunkX, playerChunkY);
    
    // Load new chunks
    for (const chunkKey of requiredChunks) {
      if (!this.loadedChunks.has(chunkKey)) {
        this.loadChunk(chunkKey);
      }
    }

    // Unload distant chunks
    for (const chunkKey of this.loadedChunks) {
      if (!requiredChunks.has(chunkKey)) {
        this.unloadChunk(chunkKey);
      }
    }
  }
}
```

### 3. Chunk Lifecycle

```typescript
export class Chunk {
  private container: PIXI.Container;
  private terrainSprites: Array<PIXI.Sprite> = [];
  private isLoaded: boolean = false;

  constructor(chunkX: number, chunkY: number, terrainData: TerrainData) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.generateTerrain(terrainData);
  }

  public load(): void {
    if (this.isLoaded) return;

    // Add to world container
    game.worldContainer.addChild(this.container);
    this.isLoaded = true;
  }

  public unload(): void {
    if (!this.isLoaded) return;

    // Remove from world container
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    
    this.isLoaded = false;
  }

  public destroy(): void {
    this.unload();
    
    // Clean up resources
    for (const sprite of this.terrainSprites) {
      sprite.destroy();
    }
    this.container.destroy();
  }
}
```

## Terrain Generation

### 1. Procedural Generation

Uses Perlin noise for natural-looking terrain:

```typescript
export class TerrainGenerator {
  private noise: NoiseFunction;
  private seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.noise = createNoise2D(seedrandom(seed));
  }

  public generateTerrainData(chunkX: number, chunkY: number): TerrainData {
    const tiles: Array<Array<TerrainTile>> = [];
    
    for (let y = 0; y < CHUNK_TILES; y++) {
      tiles[y] = [];
      for (let x = 0; x < CHUNK_TILES; x++) {
        // Calculate world position for this tile
        const worldX = (chunkX * CHUNK_TILES) + x;
        const worldY = (chunkY * CHUNK_TILES) + y;
        
        // Generate noise value
        const noiseValue = this.noise(
          worldX / NOISE_SCALE,
          worldY / NOISE_SCALE
        );
        
        // Determine terrain type based on noise
        const terrainType = this.getTerrainType(noiseValue);
        tiles[y][x] = { type: terrainType, elevation: noiseValue };
      }
    }
    
    return { tiles, biome: this.determineBiome(chunkX, chunkY) };
  }

  private getTerrainType(noiseValue: number): TerrainType {
    if (noiseValue < -0.3) return 'water';
    if (noiseValue < 0.1) return 'grass';
    if (noiseValue < 0.4) return 'dirt';
    return 'stone';
  }
}
```

### 2. Biome System

Different biomes affect terrain and entity spawning:

```typescript
export enum BiomeType {
  MEADOW = 'meadow',
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DESERT = 'desert'
}

export class BiomeManager {
  public getBiome(chunkX: number, chunkY: number): BiomeType {
    // Use noise to determine biome
    const biomeNoise = this.biomeNoise(chunkX / 10, chunkY / 10);
    
    if (biomeNoise < -0.3) return BiomeType.DESERT;
    if (biomeNoise < 0.0) return BiomeType.MEADOW;
    if (biomeNoise < 0.3) return BiomeType.FOREST;
    return BiomeType.MOUNTAIN;
  }

  public getSpawnableEntities(biome: BiomeType): Array<EntityType> {
    const spawnTable = {
      [BiomeType.MEADOW]: ['grass', 'flowers', 'small_tree'],
      [BiomeType.FOREST]: ['spruce_tree', 'oak_tree', 'rocks'],
      [BiomeType.MOUNTAIN]: ['rocks', 'ore_deposits', 'spruce_tree'],
      [BiomeType.DESERT]: ['cactus', 'sand_dunes', 'rocks']
    };
    
    return spawnTable[biome] || [];
  }
}
```

## Entity-Chunk Relationship

### 1. Decoupled Architecture

Entities are NOT children of chunks - they exist independently:

```typescript
// WRONG: Entity as child of chunk
chunk.container.addChild(entity.container); // Don't do this

// CORRECT: Entity on main stage with global coordinates
game.worldContainer.addChild(entity.container);
entity.container.x = globalX;
entity.container.y = globalY;
```

### 2. Entity Positioning

```typescript
export class EntityManager {
  public placeEntity(entity: GameObject, x: number, y: number): void {
    // Set global position
    const transform = entity.getTrait('position');
    transform.position.position = { x, y, type: 'global' };

    // Update container position
    const container = entity.getTrait('container');
    container.container.x = x;
    container.container.y = y;

    // Add to world (not to specific chunk)
    game.worldContainer.addChild(container.container);
  }

  public getEntitiesInChunk(chunkX: number, chunkY: number): Array<GameObject> {
    const entities: Array<GameObject> = [];
    
    for (const entity of this.getAllEntities()) {
      const transform = entity.getTrait('position');
      const { x, y } = transform.position.position;
      
      const entityChunkX = Math.floor(x / CHUNK_SIZE);
      const entityChunkY = Math.floor(y / CHUNK_SIZE);
      
      if (entityChunkX === chunkX && entityChunkY === chunkY) {
        entities.push(entity);
      }
    }
    
    return entities;
  }
}
```

## Performance Optimization

### 1. Chunk Culling

Only render chunks within view distance:

```typescript
export class ChunkRenderer {
  public updateVisibility(cameraX: number, cameraY: number, viewDistance: number): void {
    for (const [chunkKey, chunk] of this.loadedChunks) {
      const distance = this.calculateChunkDistance(chunk, cameraX, cameraY);
      
      if (distance <= viewDistance) {
        chunk.setVisible(true);
      } else {
        chunk.setVisible(false); // Hidden but still loaded
      }
    }
  }
}
```

### 2. Level of Detail (LOD)

Reduce detail for distant chunks:

```typescript
export class LODManager {
  public updateChunkLOD(chunk: Chunk, distance: number): void {
    if (distance < 1000) {
      chunk.setLOD('high'); // Full detail
    } else if (distance < 2000) {
      chunk.setLOD('medium'); // Reduced sprites
    } else {
      chunk.setLOD('low'); // Simplified rendering
    }
  }
}
```

### 3. Memory Management

```typescript
export class ChunkCache {
  private cache: Map<string, Chunk> = new Map();
  private readonly MAX_CACHED_CHUNKS = 100;

  public addChunk(chunkKey: string, chunk: Chunk): void {
    // Remove oldest chunks if cache is full
    if (this.cache.size >= this.MAX_CACHED_CHUNKS) {
      const oldestKey = this.cache.keys().next().value;
      const oldChunk = this.cache.get(oldestKey);
      oldChunk?.destroy();
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(chunkKey, chunk);
  }
}
```

## Integration with Multiplayer

### 1. Server-Side Chunks

Server maintains chunk state for persistence:

```typescript
// Server chunk management
export class ServerChunkManager {
  private chunks: Map<string, ServerChunk> = new Map();

  public async getChunk(chunkX: number, chunkY: number): Promise<ServerChunk> {
    const chunkKey = `${chunkX},${chunkY}`;
    
    if (!this.chunks.has(chunkKey)) {
      // Load from database or generate
      const chunk = await this.loadOrGenerateChunk(chunkX, chunkY);
      this.chunks.set(chunkKey, chunk);
    }
    
    return this.chunks.get(chunkKey)!;
  }

  public saveChunk(chunk: ServerChunk): void {
    // Persist chunk data to database
    database.saveChunk(chunk.serialize());
  }
}
```

### 2. Client-Server Sync

```typescript
// Request chunk data from server
const chunkData = await multiplayer.requestChunk(chunkX, chunkY);

// Generate client chunk from server data
const chunk = ChunkGenerator.fromServerData(chunkData);
```

## Usage Examples

### 1. Basic World Setup

```typescript
const worldManager = new WorldManager();
const chunkManager = new ChunkManager();

// Initialize world
await worldManager.initialize();

// Set player position (triggers chunk loading)
worldManager.setPlayerPosition(0, 0);
```

### 2. Entity Placement

```typescript
// Place entity at global coordinates
const entity = WorldObjects.spruceTree.createLocal(game, { x: 1500, y: 800 });

// Entity automatically positioned on correct chunk visually
// But managed independently for easy cleanup
```

### 3. Chunk Queries

```typescript
// Get all entities in a specific chunk
const entities = entityManager.getEntitiesInChunk(3, 2);

// Get chunk at world position
const chunk = chunkManager.getChunkAtPosition(1500, 800);

// Check if chunk is loaded
const isLoaded = chunkManager.isChunkLoaded(3, 2);
```

The World and Chunk System provides efficient, scalable world management with procedural generation, dynamic loading, and seamless integration with the entity and networking systems.
