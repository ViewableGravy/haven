/***** TYPE DEFINITIONS *****/
import { createObjectFactory } from "./utilities/createObjectFactory";

// Import existing factory functions
import { createStandardAssembler } from "./objects/assembler/factory";
import { createStandardSpruceTree } from "./objects/spruceTree/factory";

/***** WORLD OBJECTS REGISTRY *****/
export const WorldObjects = {
  /**
   * Assembler entity factory
   */
  assembler: createObjectFactory(createStandardAssembler, ['position', 'placeable']),

  /**
   * Spruce Tree entity factory  
   */
  spruceTree: createObjectFactory(createStandardSpruceTree, ['position', 'placeable']),

} as const;

/***** TYPE EXPORTS *****/
export type WorldObjectsType = typeof WorldObjects;
export type WorldObjectKey = keyof WorldObjectsType;

/***** UTILITY FUNCTIONS *****/
export function getWorldObjectFactory<K extends WorldObjectKey>(key: K): WorldObjectsType[K] {
  return WorldObjects[key];
}

export function getAllWorldObjectKeys(): Array<WorldObjectKey> {
  return Object.keys(WorldObjects) as Array<WorldObjectKey>;
}
