/***** TYPE DEFINITIONS *****/
import { noise as perlinNoise } from "@chriscourses/perlin-noise";
import { GameConstants } from "../shared/constants";
import { Logger } from "../utilities/Logger";
import { createChunkKey } from "../utilities/tagged";
import type { ServerChunkObject } from "./chunkdb";
import { BiomeManager } from "./systems/biomes/biomeManager";
import type { EntityData } from "./types";
import type { LoadChunkEvent } from "./types/events/load_chunk";

/***** SERVER CHUNK GENERATOR *****/
export class ServerChunkGenerator {
  private readonly tileSize: number = GameConstants.TILE_SIZE;
  private readonly chunkSize: number = GameConstants.CHUNK_SIZE;
  private biomeManager: BiomeManager;

  constructor(seed: string = GameConstants.DEFAULT_SEED) {
    this.biomeManager = new BiomeManager(seed);
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

    Logger.log(`ServerChunkGenerator: Generated chunk (${chunkX}, ${chunkY}) with ${tiles.length} tiles and ${entities.length} entities`);
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

    // First pass: Generate initial tiles based on perlin noise
    for (let i = 0; i < this.chunkSize; i++) {
      for (let j = 0; j < this.chunkSize; j++) {
        const x = this.tileSize * i;
        const y = this.tileSize * j;

        // Calculate global position for noise sampling
        const xOffset = (chunkX * size) + x;
        const yOffset = (chunkY * size) + y;
        
        // Generate initial biome and sprite index using perlin noise
        const biomeData = this.generateBiomeAndSprite(xOffset, yOffset);

        tiles.push({
          x,
          y,
          index: biomeData.index,
          biome: biomeData.biome
        });
      }
    }

    // Run multiple smoothing passes to create natural biome transitions
    this.applySmoothingPasses(tiles, chunkX, chunkY, 5);

    return tiles;
  }

  /**
   * Generate biome and sprite index using BiomeManager and perlin noise
   * 
   * @param x - The x coordinate for noise generation
   * @param y - The y coordinate for noise generation
   * @returns Object containing biome type and sprite index
   */
  private generateBiomeAndSprite(x: number, y: number): { biome: "desert" | "meadow"; index: number } {
    // Get biome from BiomeManager
    const biomeName = this.biomeManager.getBiome(x, y);
    
    // Map biome to render type
    const renderBiome: "desert" | "meadow" = biomeName === "Temperate Grassland" ? "meadow" : "desert";
    
    // Generate sprite index using perlin noise
    const spriteNoise = perlinNoise((x + 200_000) / 1500, y / 1500); // Offset to avoid correlation with biome noise

    let spriteIndex: number;
    if (renderBiome === "meadow") {
      // Meadow biome (0-5 sprite indices)
      spriteIndex = Math.floor(spriteNoise * 6);
    } else {
      // Desert biome (0-8 sprite indices)
      spriteIndex = Math.floor(spriteNoise * 9);
    }
    
    return {
      biome: renderBiome,
      index: spriteIndex
    };
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
      
      // Check biome at tree position and within 3-tile radius - only place trees on meadow tiles
      if (!this.isSafeTreeLocation(globalTreeX, globalTreeY)) {
        continue; // Skip tree generation if location is unsafe (desert nearby)
      }
      
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
   * Check if a tree location is safe (no desert tiles within 3-tile radius)
   * @param globalX - Global x coordinate of potential tree position
   * @param globalY - Global y coordinate of potential tree position
   * @returns True if location is safe for tree placement, false otherwise
   */
  private isSafeTreeLocation(globalX: number, globalY: number): boolean {
    const checkRadius = 3 * this.tileSize; // 3 tiles in pixels
    
    // Check a grid of positions around the tree location
    for (let dx = -checkRadius; dx <= checkRadius; dx += this.tileSize) {
      for (let dy = -checkRadius; dy <= checkRadius; dy += this.tileSize) {
        const checkX = globalX + dx;
        const checkY = globalY + dy;
        
        // Generate biome at this position (Not ideal for performance, and not a long term solution, but good for testing for now)
        const biomeData = this.generateBiomeAndSprite(checkX, checkY);
        
        // If any position within radius is desert, location is unsafe
        if (biomeData.biome === "desert") {
          return false;
        }
      }
    }
    
    return true; // All positions within radius are meadow
  }

  /**
   * Check if a meadow tile should be converted to desert based on neighboring desert tiles
   * @param globalX - Global x coordinate of the tile
   * @param globalY - Global y coordinate of the tile
   * @returns True if the meadow tile should be converted to desert
   */
  private shouldConvertMeadowToDesert(globalX: number, globalY: number): boolean {
    // Check adjacent tiles (1 tile away in each direction)
    const checkPositions = [
      { x: globalX - this.tileSize, y: globalY }, // Left
      { x: globalX + this.tileSize, y: globalY }, // Right
      { x: globalX, y: globalY - this.tileSize }, // Up
      { x: globalX, y: globalY + this.tileSize }  // Down
    ];

    let desertCount = 0;
    
    for (const pos of checkPositions) {
      const biomeData = this.generateBiomeAndSprite(pos.x, pos.y);
      if (biomeData.biome === "desert") {
        desertCount++;
      }
    }

    // Convert to desert if at least 2 adjacent tiles are desert
    return desertCount >= 2;
  }

  /**
   * Get the closest appropriate desert tile variant based on position
   * @param globalX - Global x coordinate of the tile
   * @param globalY - Global y coordinate of the tile
   * @returns Desert biome data with appropriate sprite index
   */
  private getClosestDesertTile(globalX: number, globalY: number): { biome: "desert"; index: number } {
    // Generate a pseudo-random desert tile index based on position
    const positionSeed = (globalX * 127) ^ (globalY * 311);
    const randomValue = Math.abs(Math.sin(positionSeed)) * 43758.5453;
    const desertIndex = Math.floor((randomValue % 1) * 9); // 0-8 desert variants
    
    return {
      biome: "desert",
      index: desertIndex
    };
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

    Logger.log(`ServerChunkGenerator: Generating ${radius}x${radius} chunks around (${centerX}, ${centerY})`);

    for (let x = centerX - halfRadius; x <= centerX + halfRadius; x++) {
      for (let y = centerY - halfRadius; y <= centerY + halfRadius; y++) {
        const chunk = this.generateChunk(x, y);
        chunks.push(chunk);
      }
    }

    Logger.log(`ServerChunkGenerator: Generated ${chunks.length} chunks`);
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

    Logger.log(`ServerChunkGenerator: Generating ${width}x${height} chunks around (${centerX}, ${centerY})`);

    for (let x = centerX - halfWidth; x <= centerX + halfWidth; x++) {
      for (let y = centerY - halfHeight; y <= centerY + halfHeight; y++) {
        const chunk = this.generateChunk(x, y);
        chunks.push(chunk);
      }
    }

    Logger.log(`ServerChunkGenerator: Generated ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Apply multiple smoothing passes to create natural biome transitions
   * @param tiles - Array of tiles to apply smoothing to
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   * @param passes - Number of smoothing passes to run
   */
  private applySmoothingPasses(tiles: Array<LoadChunkEvent.Tile>, chunkX: number, chunkY: number, passes: number): void {
    const size = this.chunkSize * this.tileSize;
    
    for (let pass = 0; pass < passes; pass++) {
      // Create a copy of current tiles to avoid modifying during iteration
      const currentTiles = [...tiles];
      
      for (let i = 0; i < tiles.length; i++) {
        const tile = currentTiles[i];
        
        // Only check meadow tiles for conversion
        if (tile.biome === "meadow") {
          // Calculate global position
          const globalX = (chunkX * size) + tile.x;
          const globalY = (chunkY * size) + tile.y;
          
          // Check if this meadow tile should be converted to desert
          if (this.shouldConvertMeadowToDesert(globalX, globalY)) {
            const desertTile = this.getClosestDesertTile(globalX, globalY);
            tiles[i].biome = desertTile.biome;
            tiles[i].index = desertTile.index;
          }
        }
      }
    }
  }
}