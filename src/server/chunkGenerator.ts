/***** TYPE DEFINITIONS *****/
import { noiseSeed, noise as perlinNoise } from "@chriscourses/perlin-noise";
import { GameConstants } from "../shared/constants";
import { logger } from "../utilities/logger";
import { createChunkKey } from "../utilities/tagged";
import type { ServerChunkObject } from "./chunkdb";
import type { EntityData } from "./types";
import type { LoadChunkEvent } from "./types/events/load_chunk";

/***** SERVER CHUNK GENERATOR *****/
export class ServerChunkGenerator {
  private readonly tileSize: number = GameConstants.TILE_SIZE;
  private readonly chunkSize: number = GameConstants.CHUNK_SIZE;
  private readonly noiseDivisor: number = GameConstants.NOISE_DIVISOR;
  private readonly seed: string | number;

  constructor(seed: string | number = GameConstants.DEFAULT_SEED) {
    this.seed = seed;
    this.initializeSeed();
  }

  /**
   * Initialize the noise seed for consistent generation
   */
  private initializeSeed(): void {
    const seedValue = typeof this.seed === 'string' 
      ? this.stringToNumber(this.seed) 
      : this.seed;
    noiseSeed(seedValue);
  }

  /**
   * Generate a complete chunk with tiles at the specified coordinates
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Server chunk object with generated tiles and entities array
   */
  public generateChunk(chunkX: number, chunkY: number): ServerChunkObject {
    const chunkKey = createChunkKey(chunkX, chunkY);
    const tiles = this.generateTiles(chunkX, chunkY);
    const entities = this.generateEntities(chunkX, chunkY);
    
    const chunkData: ServerChunkObject = {
      chunkKey,
      chunkX,
      chunkY,
      tiles,
      entities,
      generatedAt: Date.now()
    };

    logger.log(`ServerChunkGenerator: Generated chunk (${chunkX}, ${chunkY}) with ${tiles.length} tiles and ${entities.length} entities`);
    return chunkData;
  }

  /**
   * Generate tiles for a specific chunk
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Array of tile objects with positions and sprite indices
   */
  private generateTiles(chunkX: number, chunkY: number): Array<LoadChunkEvent.Tile> {
    const tiles: Array<LoadChunkEvent.Tile> = [];
    const size = this.chunkSize * this.tileSize;

    // Re-initialize seed to ensure consistent generation
    this.initializeSeed();

    for (let i = 0; i < this.chunkSize; i++) {
      for (let j = 0; j < this.chunkSize; j++) {
        const x = this.tileSize * i;
        const y = this.tileSize * j;

        // Calculate global position for noise sampling
        const xOffset = (chunkX * size) + x;
        const yOffset = (chunkY * size) + y;
        
        // Generate sprite index using perlin noise
        const spriteIndex = this.generateSpriteIndex(xOffset / this.noiseDivisor, yOffset / this.noiseDivisor);

        tiles.push({
          x,
          y,
          spriteIndex
        });
      }
    }

    return tiles;
  }

  /**
   * Generate a sprite index based on perlin noise at the given coordinates
   * @param x - The x coordinate for noise generation
   * @param y - The y coordinate for noise generation
   * @returns Sprite index (0-5) for meadow sprites
   */
  private generateSpriteIndex(x: number, y: number): number {
    // Generate primary noise value (0-1)
    const baseNoise: number = perlinNoise(x, y);
    
    // Generate secondary noise layer with offset
    const secondaryNoise: number = perlinNoise(x + 100, y + 100);
    
    // Combine noise layers (weighted average)
    const combinedNoise: number = (baseNoise * 0.5) + (secondaryNoise * 0.4);
    
    // Add random variation (0.1-0.2)
    const randomFactor: number = 0.05 + Math.random() * 0.05;
    const variation: number = (Math.random() - 0.05) * randomFactor;
    const noiseValue: number = Math.max(0, Math.min(1, combinedNoise + variation));
    
    // Map to sprite index (0-5)
    return Math.floor(noiseValue * 6);
  }

  /**
   * Generate entities for a specific chunk using secondary noise
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @returns Array of entity data objects
   */
  private generateEntities(chunkX: number, chunkY: number): Array<EntityData> {
    const entities: Array<EntityData> = [];
    const size = this.chunkSize * this.tileSize;

    // Re-initialize seed to ensure consistent generation
    this.initializeSeed();

    // Generate a deterministic but varied number of trees per chunk (3-5)
    const chunkSeed = (chunkX * 73856093) ^ (chunkY * 19349663); // Hash chunk coordinates
    const seededRandom = Math.abs(Math.sin(chunkSeed)) * 43758.5453; // Convert to 0-1 range
    const treeCount = 3 + Math.floor((seededRandom % 1) * 3); // 3-5 trees

    // Generate spruce trees at varied positions within the chunk
    for (let i = 0; i < treeCount; i++) {
      // Use chunk coordinates and tree index to create unique seeds for each tree
      const treeSeedX = ((chunkX + i * 7) * 127) ^ ((chunkY + i * 11) * 311);
      const treeSeedY = ((chunkX + i * 13) * 197) ^ ((chunkY + i * 17) * 419);
      
      // Generate pseudo-random values (0-1) for positioning
      const randomX = Math.abs(Math.sin(treeSeedX)) * 43758.5453;
      const randomY = Math.abs(Math.sin(treeSeedY)) * 43758.5453;
      const positionNoiseX = randomX % 1;
      const positionNoiseY = randomY % 1;
      
      // Convert to position within chunk, with padding from edges
      const padding = 96; // Keep trees away from chunk edges (space for 2x3 tree)
      const availableSpace = size - (padding * 2);
      const localTreeX = Math.floor(padding + (positionNoiseX * availableSpace));
      const localTreeY = Math.floor(padding + (positionNoiseY * availableSpace));
      
      // Convert local chunk coordinates to global world coordinates
      const globalTreeX = (chunkX * size) + localTreeX;
      const globalTreeY = (chunkY * size) + localTreeY;
      
      // Generate unique entity ID using chunk and tree index
      const entityId = `spruce-tree-${chunkX}-${chunkY}-${i}`;
      
      entities.push({
        id: entityId,
        type: "spruce-tree",
        x: globalTreeX,
        y: globalTreeY,
        chunkX,
        chunkY,
        placedBy: "server" // Server-generated entity
      });
    }

    return entities;
  }

  /**
   * Generate multiple chunks in a radius around a center point
   * @param centerX - The center chunk x coordinate
   * @param centerY - The center chunk y coordinate
   * @param radius - The radius in chunks (5 means 5x5 grid around center)
   * @returns Array of generated chunk objects
   */
  public generateChunksInRadius(centerX: number, centerY: number, radius: number = 5): Array<ServerChunkObject> {
    const chunks: Array<ServerChunkObject> = [];
    const halfRadius = Math.floor(radius / 2);

    logger.log(`ServerChunkGenerator: Generating ${radius}x${radius} chunks around (${centerX}, ${centerY})`);

    for (let x = centerX - halfRadius; x <= centerX + halfRadius; x++) {
      for (let y = centerY - halfRadius; y <= centerY + halfRadius; y++) {
        const chunk = this.generateChunk(x, y);
        chunks.push(chunk);
      }
    }

    logger.log(`ServerChunkGenerator: Generated ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Generate multiple chunks in a rectangular area around a center point
   * @param centerX - The center chunk x coordinate
   * @param centerY - The center chunk y coordinate
   * @param width - The width in chunks (default uses CHUNK_RENDER_WIDTH)
   * @param height - The height in chunks (default uses CHUNK_RENDER_HEIGHT)
   * @returns Array of generated chunk objects
   */
  public generateChunksInRectangle(
    centerX: number, 
    centerY: number, 
    width: number = GameConstants.CHUNK_RENDER_WIDTH, 
    height: number = GameConstants.CHUNK_RENDER_HEIGHT
  ): Array<ServerChunkObject> {
    const chunks: Array<ServerChunkObject> = [];
    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);

    logger.log(`ServerChunkGenerator: Generating ${width}x${height} chunks around (${centerX}, ${centerY})`);

    for (let x = centerX - halfWidth; x <= centerX + halfWidth; x++) {
      for (let y = centerY - halfHeight; y <= centerY + halfHeight; y++) {
        const chunk = this.generateChunk(x, y);
        chunks.push(chunk);
      }
    }

    logger.log(`ServerChunkGenerator: Generated ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Convert a string to a numeric hash for seeding purposes
   * @param str - The string to convert to a number
   * @returns A numeric hash of the input string
   */
  private stringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get the current configuration
   * @returns Object containing generator configuration
   */
  public getConfig() {
    return {
      tileSize: this.tileSize,
      chunkSize: this.chunkSize,
      noiseDivisor: this.noiseDivisor,
      seed: this.seed
    };
  }
}