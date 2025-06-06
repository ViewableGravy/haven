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

  /** Chunk render dimensions (rectangular pattern) */
  export const CHUNK_RENDER_WIDTH = 22;  // 15 chunks wide
  export const CHUNK_RENDER_HEIGHT = 12; // 10 chunks high
  
  /** Half dimensions for chunk calculations */
  export const HALF_CHUNK_RENDER_WIDTH = Math.floor(CHUNK_RENDER_WIDTH / 2);
  export const HALF_CHUNK_RENDER_HEIGHT = Math.floor(CHUNK_RENDER_HEIGHT / 2);

  /***** RENDER TEXTURE POOL CONFIGURATION *****/
  /** Maximum number of render textures to keep in the pool */
  export const MAX_RENDER_TEXTURE_POOL_SIZE = 20;

  /***** NOISE GENERATION CONFIGURATION *****/
  /** Divisor for noise generation to control terrain scale */
  export const NOISE_DIVISOR = 3000;
  
  /** Default seed for consistent world generation */
  export const DEFAULT_SEED = 'haven-world-seed';

  /***** SERVER CONFIGURATION *****/
  /** Default server port */
  export const DEFAULT_SERVER_PORT = 8081; // Changed to avoid conflicts
  
  /** WebSocket reconnection attempts */
  export const MAX_RECONNECTION_ATTEMPTS = 5;

  /***** DEBUG CONFIGURATION *****/
  /** Enable debug logging throughout the application */
  export const DEBUG = false;
}