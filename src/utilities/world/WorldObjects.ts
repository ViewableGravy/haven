/***** TYPE DEFINITIONS *****/
import { createObjectFactory } from "./createWorldObject";

// Import existing factory functions
import { createStandardAssembler } from "../../objects/assembler/factory";
import { createStandardSpruceTree } from "../../objects/spruceTree/factory";

/***** WORLD OBJECTS REGISTRY *****/
export const WorldObjects = {
  /**
   * Assembler entity factory
   * Provides createLocal, createNetworked, and castToNetworked methods
   */
  assembler: createObjectFactory(createStandardAssembler, "assembler"),

  /**
   * Spruce Tree entity factory  
   * Provides createLocal, createNetworked, and castToNetworked methods
   */
  spruceTree: createObjectFactory(createStandardSpruceTree, "spruce-tree"),
};