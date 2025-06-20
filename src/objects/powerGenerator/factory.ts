/***** IMPORTS *****/
import { createFactory } from "../../utilities/createFactory";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import { PowerGenerator } from "./base";
import { createPowerGeneratorInfographicNode } from "./info";

/***** FACTORY FUNCTION *****/
export type PowerGeneratorEntity = PowerGenerator;

/***** FACTORY START *****/
export function createStandardPowerGenerator(game: Game, position: Position): PowerGenerator {
  const powerGenerator = new PowerGenerator(game, position);

  const { container } = powerGenerator.getTrait('container');

  // Add graphics to container
  container.addChild(powerGenerator.generatorGraphics);

  // Ensure proper z-index sorting
  container.sortableChildren = true;

  return powerGenerator;
}

/***** UNIFIED FACTORY *****/
export const powerGeneratorFactory = createFactory({
  factoryFn: createStandardPowerGenerator,
  network: {
    syncTraits: ['position', 'placeable', 'powered'],
    syncFrequency: 'batched',
    priority: 'normal',
    persistent: true
  }
});

/***** INFOGRAPHIC REGISTRATION *****/
infographicsRegistry.register("power-generator", (entity: PowerGenerator) => ({
  name: "Power Generator",
  component: createPowerGeneratorInfographicNode(entity),
  createNetworked: powerGeneratorFactory.createNetworked,
  previewCreatorFunction: createStandardPowerGenerator
}));
