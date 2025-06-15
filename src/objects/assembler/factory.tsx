/***** TYPE DEFINITIONS *****/
import { Sprite, Texture } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import type { NetworkSyncConfig } from "../../objects/traits/network";
import { createFactory } from "../../utilities/createFactory";
import { GameObject } from "../base";
import { ContainerTrait } from "../traits/container";
import { GhostableTrait } from "../traits/ghostable";
import { PlaceableTrait } from "../traits/placeable";
import { TransformTrait } from "../traits/transform";
import { createTestEntityInfographicNode } from "./info";

/***** BASE ASSEMBLER *****/
export class BaseAssembler extends GameObject {
  public assemblerSprite: Sprite;
  public selectionSprite: Sprite;

  constructor(game: Game, position: Position) {
    super({ name: "assembler" });

    const transformTrait = TransformTrait.createLarge(game, position.x, position.y, position.type);
    this.assemblerSprite = BaseAssembler.createAssemblerSprite(transformTrait);
    this.selectionSprite = BaseAssembler.createSelectionSprite(transformTrait);

    // Initialize traits
    this.addTrait('position', transformTrait);
    this.addTrait('container', new ContainerTrait(this, transformTrait));
    this.addTrait('ghostable', new GhostableTrait(this, false));
    this.addTrait('placeable', new PlaceableTrait(this, false, () => {
      this.getTrait('ghostable').ghostMode = false;
    }));
  }  private static createAssemblerSprite(transform: TransformTrait): Sprite {
    const sprite = AssemblerSprite.createSprite("assembling-machine-1");
    sprite.interactive = true;
    sprite.width = transform.size.width;
    sprite.height = transform.size.height;
    sprite.x = 0;
    sprite.y = 0;
    return sprite;
  }
  private static createSelectionSprite(transform: TransformTrait): Sprite {
    const sprite = new Sprite(Texture.from(Selection));
    sprite.width = transform.size.width;
    sprite.height = transform.size.height;    sprite.x = 0;
    sprite.y = 0;
    sprite.renderable = false;
    return sprite;
  }

  public setupInteractivity(): void {
    this.assemblerSprite.addEventListener("mouseover", () => {
      // Only show selection if not in ghost mode
      if (this.getTrait('ghostable').ghostMode) return;

      this.selectionSprite.renderable = true;

      // Get assembler infographic from the registry, passing this entity instance
      const assemblerInfographic = infographicsRegistry.get("assembler", this);

      if (assemblerInfographic) {
        infographicStore.setState(() => ({
          active: true,
          component: assemblerInfographic.component,
          item: assemblerInfographic.creatorFunction ? {
            name: assemblerInfographic.name,
            node: assemblerInfographic.name,
            creatorFunction: assemblerInfographic.creatorFunction
          } : undefined
        }));
      }
    });

    this.assemblerSprite.addEventListener("mouseout", () => {
      this.selectionSprite.renderable = false;

      infographicStore.setState(() => ({ active: false }));
    });
  }

  public destroy(): void {
    // Call the generic GameObject destroy first to clean up all traits
    super.destroy();
    
    // Clean up assembler specific resources
    this.assemblerSprite.removeAllListeners();
  }

}

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

/***** LEGACY FACTORY METHODS - DEPRECATED *****/
// These are maintained for backward compatibility but should be migrated to GameObjects.assembler.*

export async function createNetworkedAssembler(game: Game, position: Position): Promise<Assembler> {
  return await game.worldManager.createNetworkedEntity({
    factoryFn: () => createStandardAssembler(game, { position }),
    syncTraits: ['position', 'placeable'],
    autoPlace: {
      x: position.x,
      y: position.y
    }
  });
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

/***** INFOGRAPHIC REGISTRATION *****/
// Register the assembler infographic when this module loads
infographicsRegistry.register("assembler", (entity: Assembler) => ({
  name: "Assembler",
  component: createTestEntityInfographicNode(entity),
  creatorFunction: createNetworkedAssembler,
  previewCreatorFunction: (game: Game, position: Position) => createStandardAssembler(game, { position })
}));

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

