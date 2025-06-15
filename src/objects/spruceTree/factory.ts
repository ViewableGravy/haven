/***** TYPE DEFINITIONS *****/
import { createFactory } from "../../utilities/createFactory";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import { BaseSpruceTree } from "./base";
import { createSpruceTreeInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type SpruceTree = BaseSpruceTree;

/***** FACTORY START *****/
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

/***** UNIFIED FACTORY *****/
export const spruceTreeFactory = createFactory({
  factoryFn: createStandardSpruceTree,
  network: {
    syncTraits: ['position', 'placeable'],
    syncFrequency: 'batched',
    priority: 'normal',
    persistent: true
  }
});

/***** INFOGRAPHIC REGISTRATION *****/
infographicsRegistry.register("spruce-tree", (entity: SpruceTree) => ({
  name: "Spruce Tree",
  component: createSpruceTreeInfographicNode(entity),
  createNetworked: spruceTreeFactory.createNetworked,
  previewCreatorFunction: createStandardSpruceTree
}));

