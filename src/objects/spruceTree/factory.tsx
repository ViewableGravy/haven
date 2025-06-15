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

/***** NEW FACTORY METHODS *****/
export function createNetworkedSpruceTree(game: Game, position: Position): SpruceTree {
  return game.worldManager.createNetworkedEntity({
    factoryFn: () => createStandardSpruceTree(game, position),
    syncTraits: ['position', 'placeable'],
    autoPlace: {
      x: position.x,
      y: position.y
    }
  });
}

export function createLocalSpruceTree(game: Game, position: Position): SpruceTree {
  return game.worldManager.createLocalEntity(
    () => createStandardSpruceTree(game, position),
    {
      autoPlace: {
        x: position.x,
        y: position.y
      }
    }
  );
}

/***** INFOGRAPHIC REGISTRATION *****/
// Register the spruce tree infographic when this module loads
infographicsRegistry.register("spruce-tree", (entity: SpruceTree) => ({
  name: "Spruce Tree",
  component: createSpruceTreeInfographicNode(entity),
  creatorFunction: createNetworkedSpruceTree
}));

/***** ENTITY SYNC REGISTRATION *****/
// Register the spruce tree entity sync creator
// Use the basic factory for server entities (no NetworkTrait)
entitySyncRegistry.register("spruce-tree", {
  name: "Spruce Tree",
  creatorFunction: createStandardSpruceTree
});
