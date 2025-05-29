import { GameConstants } from "../../shared/constants";
import type { Game } from "../../utilities/game/game";
import { logger } from "../../utilities/logger";
import type { ChunkKey } from "../../utilities/tagged";
import type { ChunkManager } from "./index";

/***** TYPE DEFINITIONS *****/
interface PlayerChunkPosition {
  chunkX: number;
  chunkY: number;
}

/***** CHUNK UNLOADING MANAGER *****/
/**
 * Manages automatic unloading of chunks that are outside the render distance
 * Monitors player position and removes chunks beyond DEFAULT_LOAD_RADIUS
 */
export class ChunkUnloadingManager {
  private game: Game;
  private chunkManager: ChunkManager;
  private currentPlayerChunk: PlayerChunkPosition | null = null;
  private unsubscribeFromPlayer: (() => void) | null = null;

  constructor(game: Game, chunkManager: ChunkManager) {
    this.game = game;
    this.chunkManager = chunkManager;
  }

  /***** INITIALIZATION *****/
  /**
   * Initialize the unloading manager by subscribing to player position changes
   * This should be called after multiplayer is set up so localPlayer is available
   */
  public initialize(): void {
    // Access player through multiplayer manager if available
    const localPlayer = this.game.controllers.multiplayer?.localPlayer;
    
    if (!localPlayer) {
      console.warn('ChunkUnloadingManager: No local player found, chunk unloading disabled');
      return;
    }

    // Subscribe to player position changes
    this.unsubscribeFromPlayer = localPlayer.position.subscribe((position) => {
      this.handlePlayerPositionChange(position.x, position.y);
    });

    // Set initial player chunk position
    const initialPosition = localPlayer.position.position;
    if (initialPosition.x !== undefined && initialPosition.y !== undefined) {
      this.handlePlayerPositionChange(initialPosition.x, initialPosition.y);
    }

    logger.log('ChunkUnloadingManager: Initialized and monitoring player position');
  }

  /***** POSITION MONITORING *****/
  /**
   * Handle player position changes and check for chunk boundary crossings
   * @param playerX - Player's world x coordinate
   * @param playerY - Player's world y coordinate
   */
  private handlePlayerPositionChange(playerX: number, playerY: number): void {
    // Calculate player's chunk coordinates
    const chunkX = Math.floor(playerX / this.game.consts.chunkAbsolute);
    const chunkY = Math.floor(playerY / this.game.consts.chunkAbsolute);

    // Check if player has moved to a different chunk
    if (!this.currentPlayerChunk || 
        this.currentPlayerChunk.chunkX !== chunkX || 
        this.currentPlayerChunk.chunkY !== chunkY) {
      
      const previousChunk = this.currentPlayerChunk;
      this.currentPlayerChunk = { chunkX, chunkY };
      
      // Perform chunk unloading when crossing chunk boundaries
      this.performChunkUnloading(chunkX, chunkY);
      
      if (previousChunk) {
        logger.log(`ChunkUnloadingManager: Player moved from chunk (${previousChunk.chunkX}, ${previousChunk.chunkY}) to (${chunkX}, ${chunkY})`);
      } else {
        logger.log(`ChunkUnloadingManager: Initial player chunk position set to (${chunkX}, ${chunkY})`);
      }
    }
  }

  /***** CHUNK UNLOADING LOGIC *****/
  /**
   * Unload chunks that are outside the render distance
   * @param playerChunkX - Player's current chunk x coordinate
   * @param playerChunkY - Player's current chunk y coordinate
   */
  private performChunkUnloading(playerChunkX: number, playerChunkY: number): void {
    // Get all currently loaded chunks
    const loadedChunks = this.chunkManager['chunkRegistry'].getAllChunks();
    const chunksToUnload: Array<ChunkKey> = [];

    // Check each loaded chunk against the render distance
    loadedChunks.forEach((_, chunkKey) => {
      if (this.isChunkOutsideRenderDistance(chunkKey, playerChunkX, playerChunkY)) {
        chunksToUnload.push(chunkKey);
      }
    });

    // Unload chunks that are too far away
    if (chunksToUnload.length > 0) {
      logger.log(`ChunkUnloadingManager: Unloading ${chunksToUnload.length} chunks outside render distance`);
      
      chunksToUnload.forEach((chunkKey) => {
        this.chunkManager.unloadChunk(chunkKey);
        logger.log(`ChunkUnloadingManager: Unloaded chunk ${chunkKey}`);
      });
    }
  }

  /***** DISTANCE CALCULATION *****/
  /**
   * Check if a chunk is outside the render distance from the player
   * @param chunkKey - The chunk key to check
   * @param playerChunkX - Player's current chunk x coordinate
   * @param playerChunkY - Player's current chunk y coordinate
   * @returns True if the chunk should be unloaded
   */
  private isChunkOutsideRenderDistance(
    chunkKey: ChunkKey, 
    playerChunkX: number, 
    playerChunkY: number
  ): boolean {
    // Parse chunk coordinates from chunk key (format: "x,y")
    const [chunkXStr, chunkYStr] = chunkKey.split(',');
    const chunkX = parseInt(chunkXStr, 10);
    const chunkY = parseInt(chunkYStr, 10);

    if (isNaN(chunkX) || isNaN(chunkY)) {
      console.warn(`ChunkUnloadingManager: Invalid chunk key format: ${chunkKey}`);
      return false;
    }

    // Calculate distance from player's chunk
    const deltaX = Math.abs(chunkX - playerChunkX);
    const deltaY = Math.abs(chunkY - playerChunkY);

    // Use maximum distance (Chebyshev distance) to match server-side square loading pattern
    const maxDistance = Math.max(deltaX, deltaY);
    
    // Unload if distance exceeds the load radius
    const loadRadius = GameConstants.DEFAULT_LOAD_RADIUS;
    const halfRadius = Math.floor(loadRadius / 2);
    
    return maxDistance > halfRadius;
  }

  /***** CLEANUP *****/
  /**
   * Clean up the unloading manager and unsubscribe from player position
   */
  public destroy(): void {
    if (this.unsubscribeFromPlayer) {
      this.unsubscribeFromPlayer();
      this.unsubscribeFromPlayer = null;
    }
    
    this.currentPlayerChunk = null;
    logger.log('ChunkUnloadingManager: Destroyed');
  }
}
