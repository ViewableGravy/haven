/***** TYPE DEFINITIONS *****/
import { Sprite, Texture } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Game } from "../../utilities/game/game";
import type { Position } from "../../utilities/position";
import { GameObject } from "../base";
import { ContainerTrait } from "../traits/container";
import { GhostableTrait } from "../traits/ghostable";
import { PlaceableTrait } from "../traits/placeable";
import { TransformTrait } from "../traits/transform";

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
  }

  private static createAssemblerSprite(transform: TransformTrait): Sprite {
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
    sprite.height = transform.size.height;
    sprite.x = 0;
    sprite.y = 0;
    sprite.renderable = false;
    return sprite;
  }

  public setupInteractivity(): void {
    this.assemblerSprite.addEventListener("mouseover", () => {
      // Only show selection if not in ghost mode
      if (this.getTrait('ghostable').ghostMode) return;

      this.selectionSprite.renderable = true;      // Get assembler infographic from the registry, passing this entity instance
      infographicStore.setFromRegistry("assembler", this);
    });

    this.assemblerSprite.addEventListener("mouseout", () => {
      this.selectionSprite.renderable = false;

      infographicStore.setInactive();
    });
  }

  public destroy(): void {
    // Call the generic GameObject destroy first to clean up all traits
    super.destroy();
    
    // Clean up assembler specific resources
    this.assemblerSprite.removeAllListeners();
  }
}
