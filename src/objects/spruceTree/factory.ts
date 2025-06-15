/***** TYPE DEFINITIONS *****/
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import { createFactory } from "../../utilities/createFactory";
import { BaseSpruceTree } from "./base";
import { createSpruceTreeInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type SpruceTree = BaseSpruceTree;

export function createStandardSpruceTree(game: Game, opts: { position: Position }): SpruceTree {
  const { position } = opts;
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

/***** LEGACY FACTORY METHODS - DEPRECATED *****/
// These are maintained for backward compatibility but should be migrated to GameObjects.spruce.*

export async function createNetworkedSpruceTree(game: Game, position: Position): Promise<SpruceTree> {
  return await game.worldManager.createNetworkedEntity({
    factoryFn: () => createStandardSpruceTree(game, { position }),
    syncTraits: ['position', 'placeable'],
    autoPlace: {
      x: position.x,
      y: position.y
    }
  });
}

/***** INFOGRAPHIC REGISTRATION *****/
// Register the spruce tree infographic when this module loads
infographicsRegistry.register("spruce-tree", (entity: SpruceTree) => ({
  name: "Spruce Tree",
  component: createSpruceTreeInfographicNode(entity),
  creatorFunction: createNetworkedSpruceTree,
  previewCreatorFunction: (game: Game, position: Position) => createStandardSpruceTree(game, { position })
}));

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


