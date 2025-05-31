/***** TYPE DEFINITIONS *****/
import type { Position } from "../position";
import type { SubscribablePosition } from "../position/subscribable";

/***** GAME INTERFACE *****/
/**
 * Common interface that both PIXI.js and WebGL games must implement
 * This allows components like MouseFollower to work with either game type
 */
export interface GameInterface {
  // Core game properties
  initialized: boolean;
  initializing: boolean;
  world: {
    addChild(child: any): void;
    removeChild(child: any): void;
    [key: string]: any; // Allow additional world properties
  };
  
  // Game constants
  consts: {
    tileSize: number;
    chunkSize: number;
    chunkAbsolute: number;
  };
  
  // Game state
  state: {
    worldPointer: Position;
    screenPointer: Position;
    worldOffset: SubscribablePosition;
    zoom: number;
    minZoom: number;
    maxZoom: number;
    [key: string]: any; // Allow additional state properties
  };
  
  // Entity management
  entityManager: {
    getEntities(): any[];
    placeEntity(entity: any, x: number, y: number): boolean;
    [key: string]: any; // Allow additional methods
  };
  
  // Initialization
  initialize(el: HTMLElement): Promise<void>;
}

/***** TYPE GUARDS *****/
/**
 * Check if an object implements the GameInterface
 */
export function isGameInterface(obj: any): obj is GameInterface {
  return obj && 
    typeof obj.initialized === 'boolean' &&
    typeof obj.initializing === 'boolean' &&
    obj.world &&
    typeof obj.world.addChild === 'function' &&
    typeof obj.world.removeChild === 'function' &&
    obj.consts &&
    typeof obj.consts.tileSize === 'number' &&
    typeof obj.consts.chunkSize === 'number' &&
    typeof obj.consts.chunkAbsolute === 'number' &&
    obj.state &&
    obj.state.worldPointer &&
    obj.state.screenPointer &&
    obj.state.worldOffset &&
    typeof obj.state.zoom === 'number' &&
    obj.entityManager &&
    typeof obj.entityManager.getEntities === 'function' &&
    typeof obj.entityManager.placeEntity === 'function' &&
    typeof obj.initialize === 'function';
}
