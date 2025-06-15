import { assemblerFactory } from "./objects/assembler/factory";
import { spruceTreeFactory } from "./objects/spruceTree/factory";

/***** WORLD OBJECTS REGISTRY *****/
export const WorldObjects = {
  assembler: assemblerFactory,
  spruceTree: spruceTreeFactory,
} as const;

/***** TYPE EXPORTS *****/
export type WorldObjectsType = typeof WorldObjects;
export type WorldObjectKey = keyof WorldObjectsType;
