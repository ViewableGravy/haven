/***** TYPE DEFINITIONS *****/
import { Sprite, Texture } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import { entitySyncRegistry } from "../../utilities/multiplayer/entitySyncRegistry";
import type { Position } from "../../utilities/position";
import { Transform } from "../../utilities/transform";
import { BaseEntity } from "../base";
import { ContainerTrait } from "../traits/container";
import { GhostableTrait } from "../traits/ghostable";
import { PlaceableTrait } from "../traits/placeable";
import { createTestEntityInfographicNode } from "./info";

/***** BASE ASSEMBLER *****/
export class BaseAssembler extends BaseEntity {
  public transform: Transform;
  public assemblerSprite: Sprite;
  public selectionSprite: Sprite;
  public containerTrait: ContainerTrait;
  public ghostableTrait: GhostableTrait;
  public placeableTrait: PlaceableTrait;

  constructor(game: Game, position: Position) {
    super({ name: "assembler" });

    this.transform = Transform.createLarge(game, position.x, position.y, position.type);
    this.assemblerSprite = BaseAssembler.createAssemblerSprite(this.transform);
    this.selectionSprite = BaseAssembler.createSelectionSprite(this.transform);

    // Initialize traits
    this.containerTrait = new ContainerTrait(this, this.transform);
    this.ghostableTrait = new GhostableTrait(this, false);
    this.placeableTrait = new PlaceableTrait(this, false, () => {
      this.ghostableTrait.ghostMode = false;
    });
  }

  private static createAssemblerSprite(transform: Transform): Sprite {
    const sprite = AssemblerSprite.createSprite("assembling-machine-1");
    sprite.interactive = true;
    sprite.width = transform.size.width;
    sprite.height = transform.size.height;
    sprite.x = 0;
    sprite.y = 0;
    return sprite;
  }

  private static createSelectionSprite(transform: Transform): Sprite {
    const sprite = new Sprite(Texture.from(Selection));
    sprite.width = transform.size.width;
    sprite.height = transform.size.height;
    sprite.x = 0;
    sprite.y = 0;
    sprite.renderable = false;
    return sprite;
  }

  public setupInteractivity(): void {
    this.assemblerSprite.addEventListener("mouseover", () => {
      // Only show selection if not in ghost mode
      if (this.ghostableTrait.ghostMode) return;

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

}

/***** FACTORY FUNCTION *****/
export type Assembler = BaseAssembler;

export function createStandardAssembler(game: Game, position: Position): Assembler {
  const assembler = new BaseAssembler(game, position);

  // Add sprites to container
  assembler.containerTrait.container.addChild(assembler.assemblerSprite);
  assembler.containerTrait.container.addChild(assembler.selectionSprite);

  // Setup interactivity
  assembler.setupInteractivity();

  return assembler;
}

/***** INFOGRAPHIC REGISTRATION *****/
// Register the assembler infographic when this module loads
infographicsRegistry.register("assembler", (entity: Assembler) => ({
  name: "Assembler",
  component: createTestEntityInfographicNode(entity),
  creatorFunction: createStandardAssembler
}));

/***** ENTITY SYNC REGISTRATION *****/
// Register the assembler entity sync creator
entitySyncRegistry.register("assembler", {
  name: "Assembler",
  creatorFunction: createStandardAssembler
});
