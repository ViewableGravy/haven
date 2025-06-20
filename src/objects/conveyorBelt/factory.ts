/***** IMPORTS *****/
import { createFactory } from "../../utilities/createFactory";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import { ConveyorBelt } from "./base";
import { createConveyorBeltInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type ConveyorBeltEntity = ConveyorBelt;

/***** FACTORY START *****/
export function createStandardConveyorBelt(game: Game, position: Position): ConveyorBelt {
  const conveyorBelt = new ConveyorBelt(game, position);

  const { container } = conveyorBelt.getTrait('container');

  // Add graphics to container
  container.addChild(conveyorBelt.conveyorGraphics);

  // Ensure proper z-index sorting
  container.sortableChildren = true;

  return conveyorBelt;
}

/***** UNIFIED FACTORY *****/
export const conveyorBeltFactory = createFactory({
  factoryFn: createStandardConveyorBelt,
  network: {
    syncTraits: ['position', 'placeable', 'powered'],
    syncFrequency: 'batched',
    priority: 'normal',
    persistent: true
  }
});

/***** INFOGRAPHIC REGISTRATION *****/
infographicsRegistry.register("conveyor-belt", (entity: ConveyorBelt) => ({
  name: "Conveyor Belt",
  component: createConveyorBeltInfographicNode(entity),
  createNetworked: conveyorBeltFactory.createNetworked,
  previewCreatorFunction: createStandardConveyorBelt
}));
