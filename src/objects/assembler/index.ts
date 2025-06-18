/***** TYPE DEFINITIONS *****/
import { createFactory } from "../../utilities/createFactory";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import { BaseAssembler } from "./base";
import { createTestEntityInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type Assembler = BaseAssembler;
export type Opts = { position: Position };

/***** COMPONENT START *****/
export function createStandardAssembler(game: Game, opts: Opts): Assembler {
  const assembler = new BaseAssembler(game, opts.position);

  // Add sprites to container
  assembler.getTrait('container').container.addChild(assembler.assemblerSprite);
  assembler.getTrait('container').container.addChild(assembler.selectionSprite);

  // Setup interactivity
  assembler.setupInteractivity();

  return assembler;
}

/***** UNIFIED FACTORY *****/
export const assemblerFactory = createFactory({
  factoryFn: createStandardAssembler,
  network: {
    syncTraits: ['position', 'placeable'],
    syncFrequency: 'batched',
    priority: 'normal',
    persistent: true
  }
});

/***** INFOGRAPHIC REGISTRATION *****/
// Register the assembler infographic when this module loads
infographicsRegistry.register("assembler", (entity: Assembler) => ({
  name: "Assembler",
  component: createTestEntityInfographicNode(entity),
  createNetworked: assemblerFactory.createNetworked,
  previewCreatorFunction: (game: Game, position: Position) => createStandardAssembler(game, { position })
}));
