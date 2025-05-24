/***** TYPE DEFINITIONS *****/
import { Sprite, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Game } from "../../utilities/game/game";
import type { Position } from "../../utilities/position";
import { Transform } from "../../utilities/transform";
import { BaseEntity } from "../base";
import { EntityBuilder } from "../builder";
import { ContainerProvider, type ContainerTrait } from "../traits/container";
import { Ghostable, type GhostableTrait } from "../traits/ghostable";
import { Placeable, type PlaceableTrait } from "../traits/placeable";
import { createTestEntityInfographicNode } from "./info";

type AssemblerEntity = BaseEntity & ContainerTrait & GhostableTrait & PlaceableTrait & {
  transform: Transform;
  assemblerSprite: Sprite;
  selectionSprite: Sprite;
  setupInteractivity(): void;
};

/***** BASE ASSEMBLER *****/
export class BaseAssembler extends BaseEntity {
  public transform: Transform;
  public assemblerSprite: Sprite;
  public selectionSprite: Sprite;

  constructor(game: Game, position: Position) {
    super(`assembler-${Date.now()}-${Math.random()}`);
    
    this.transform = Transform.createMedium(game, position.x, position.y, position.type);
    this.assemblerSprite = BaseAssembler.createAssemblerSprite(this.transform);
    this.selectionSprite = BaseAssembler.createSelectionSprite(this.transform);
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
      if (Ghostable.is(this) && this.ghostMode) return;

      this.selectionSprite.renderable = true;
      infographicStore.setState(() => ({
        active: true,
        component: createTestEntityInfographicNode(this as any)
      }));
    });

    this.assemblerSprite.addEventListener("mouseout", () => {
      this.selectionSprite.renderable = false;
      infographicStore.setState(() => ({ active: false }));
    });
  }
}

/***** FACTORY FUNCTION *****/
export type Assembler = ReturnType<typeof createStandardAssembler>;
export function createStandardAssembler(game: Game, position: Position): AssemblerEntity {
  const baseAssembler = new BaseAssembler(game, position);
  
  return EntityBuilder
    .create(baseAssembler)
    .apply(ContainerProvider, { transform: baseAssembler.transform })
    .apply(Ghostable, { initialGhostMode: false })
    .apply(Placeable, { 
      initiallyPlaced: false,
      onPlace: () => {
        if (Ghostable.is(baseAssembler)) {
          baseAssembler.ghostMode = false;
        }
      }
    })
    .buildWith((assembler) => {
      invariant(assembler instanceof BaseAssembler, "Assembler must be an instance of BaseAssembler");

      // Add sprites to container after all traits are applied
      if (ContainerProvider.is(assembler)) {
        assembler.container.addChild(assembler.assemblerSprite);
        assembler.container.addChild(assembler.selectionSprite);
      }
      
      // Setup interactivity
      assembler.setupInteractivity();
      
      return assembler as AssemblerEntity;
    });
}
