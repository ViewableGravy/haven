/***** TYPE DEFINITIONS *****/
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import type { NetworkSyncConfig } from "../../objects/traits/network";
import { createFactory } from "../../utilities/createFactory";
import { BaseAssembler } from "./base";
import { createTestEntityInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type Assembler = BaseAssembler;

export function createStandardAssembler(game: Game, opts: { position: Position }): Assembler {
  const { position } = opts;
  const assembler = new BaseAssembler(game, position);

  // Add sprites to container
  assembler.getTrait('container').container.addChild(assembler.assemblerSprite);
  assembler.getTrait('container').container.addChild(assembler.selectionSprite);

  // Setup interactivity
  assembler.setupInteractivity();

  return assembler;
}

export function createLocalAssembler(game: Game, position: Position): Assembler {
  return game.worldManager.createLocalEntity(
    () => createStandardAssembler(game, { position }),
    {
      autoPlace: {
        x: position.x,
        y: position.y
      }
    }
  );
}

/***** UNIFIED FACTORY *****/
const AssemblerNetworkConfig: NetworkSyncConfig = {
  syncTraits: ['position', 'placeable'],
  syncFrequency: 'batched',
  priority: 'normal',
  persistent: true
};

export const assemblerFactory = createFactory({
  factoryFn: createStandardAssembler,
  network: AssemblerNetworkConfig
});

/***** INFOGRAPHIC REGISTRATION *****/
// Register the assembler infographic when this module loads
infographicsRegistry.register("assembler", (entity: Assembler) => ({
  name: "Assembler",
  component: createTestEntityInfographicNode(entity),
  creatorFunction: (game: Game, position: Position) => createStandardAssembler(game, { position }),
  previewCreatorFunction: (game: Game, position: Position) => createStandardAssembler(game, { position })
}));

/***** EXPORTS *****/
export { BaseAssembler } from "./base";
