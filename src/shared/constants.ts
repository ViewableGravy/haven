/***** SHARED GAME CONSTANTS *****/
/**
 * Core constants that must be synchronized between client and server
 * These values determine the fundamental structure of the game world
 */

export namespace GameConstants {
  /***** TILE AND CHUNK CONFIGURATION *****/
  /** Size of each tile in pixels */
  export const TILE_SIZE = 64;
  
  /** Number of tiles per chunk (both width and height) */
  export const CHUNK_SIZE = 16;
  
  /** Total pixel size of a chunk (TILE_SIZE * CHUNK_SIZE) */
  export const CHUNK_ABSOLUTE = TILE_SIZE * CHUNK_SIZE; // 1024 pixels

  /***** CHUNK LOADING CONFIGURATION *****/
  /** Default radius for chunk loading around player (in chunks) */
  export const DEFAULT_LOAD_RADIUS = 10;
  
  /** Half radius for chunk calculations */
  export const HALF_LOAD_RADIUS = Math.floor(DEFAULT_LOAD_RADIUS / 2);

  /***** NOISE GENERATION CONFIGURATION *****/
  /** Divisor for noise generation to control terrain scale */
  export const NOISE_DIVISOR = 500;
  
  /** Default seed for consistent world generation */
  export const DEFAULT_SEED = 'haven-world-seed';

  /***** SERVER CONFIGURATION *****/
  /** Default server port */
  export const DEFAULT_SERVER_PORT = 8080;
  
  /** WebSocket reconnection attempts */
  export const MAX_RECONNECTION_ATTEMPTS = 5;
}