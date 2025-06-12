/***** TYPE DEFINITIONS *****/
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import { entitySyncRegistry } from "../../utilities/multiplayer/entitySyncRegistry";
import type { Position } from "../../utilities/position";
import { BaseSpruceTree } from "./base";
import { createSpruceTreeInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type SpruceTree = BaseSpruceTree;

export function createStandardSpruceTree(game: Game, position: Position): SpruceTree {
  const spruceTree = new BaseSpruceTree(game, position);

  const { container } = spruceTree.getTrait('container');

  // Add sprites to container
  container.addChild(spruceTree.spruceTreeSprite);
  container.addChild(spruceTree.selectionSprite);

  // Ensure proper z-index sorting
  container.sortableChildren = true;

  // Setup interactivity
  spruceTree.setupInteractivity();

  return spruceTree;
}

/***** INFOGRAPHIC REGISTRATION *****/
// Register the spruce tree infographic when this module loads
infographicsRegistry.register("spruce-tree", (entity: SpruceTree) => ({
  name: "Spruce Tree",
  component: createSpruceTreeInfographicNode(entity),
  creatorFunction: createStandardSpruceTree
}));

/***** ENTITY SYNC REGISTRATION *****/
// Register the spruce tree entity sync creator
entitySyncRegistry.register("spruce-tree", {
  name: "Spruce Tree",
  creatorFunction: createStandardSpruceTree
});
