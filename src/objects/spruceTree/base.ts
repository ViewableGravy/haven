/***** TYPE DEFINITIONS *****/
import { Sprite, Texture } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { GameConstants } from "../../shared/constants";
import { SpruceTreeSprite } from "../../spriteSheets/spruceTree";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import type { Position } from "../../utilities/position";
import { GameObject } from "../base";
import { ContainerTrait } from "../traits/container";
import { ContextMenuTrait } from "../traits/contextMenu";
import { GhostableTrait } from "../traits/ghostable";
import { PlaceableTrait } from "../traits/placeable";
import { TransformTrait } from "../traits/transform";


/***** BASE SPRUCE TREE *****/
export class BaseSpruceTree extends GameObject {
  public spruceTreeSprite: Sprite;
  public selectionSprite: Sprite;

  constructor(game: Game, position: Position) {
    super({ name: "spruce-tree" });

    const transformTrait = TransformTrait.createSmall(game, position.x, position.y, position.type);
    this.spruceTreeSprite = BaseSpruceTree.createSpruceTreeSprite(transformTrait);
    this.selectionSprite = BaseSpruceTree.createSelectionSprite();

    // Initialize traits
    this.addTrait('position', transformTrait);
    this.addTrait('container', new ContainerTrait(this, transformTrait));
    this.addTrait('ghostable', new GhostableTrait(this, false));
    this.addTrait('placeable', new PlaceableTrait(this, false, () => {
      this.getTrait('ghostable').ghostMode = false;
    }));
    this.addTrait('contextMenu', new ContextMenuTrait(this, [
      {
        label: "Twig",
        action: () => console.log("Collected twig from spruce tree")
      },
      {
        label: "Branch", 
        action: () => console.log("Collected branch from spruce tree")
      }
    ]));
  }

  private static createSpruceTreeSprite(transform: TransformTrait): Sprite {
    const sprite = SpruceTreeSprite.createSprite("spruce-tree");
    sprite.interactive = true;
    
    // Scale sprite to fit 2 tiles wide, 3 tiles tall (128x192 -> 128x192)
    sprite.width = 128;
    sprite.height = 192;
    
    // Center horizontally, anchor to bottom for ground placement
    sprite.anchor.set(0.5, 1);
    sprite.x = transform.size.width / 2;
    sprite.y = transform.size.height;
    
    // Set z-index higher than terrain but lower than player
    sprite.zIndex = 50;
    
    return sprite;
  }

  private static createSelectionSprite(): Sprite {
    const sprite = new Sprite(Texture.from(Selection));
    // Make selection sprite 2x3 tiles (128x192 pixels) to match the tree size
    sprite.width = GameConstants.TILE_SIZE * 1.5; // 2 tiles wide
    sprite.height = GameConstants.TILE_SIZE * 2; // 3 tiles tall
    sprite.x = -GameConstants.TILE_SIZE / 4;
    sprite.y = -GameConstants.TILE_SIZE * 1.5; // Offset to position above the tree
    sprite.renderable = false;
    // Set z-index higher than the tree sprite to ensure it's always on top
    sprite.zIndex = 100;
    return sprite;
  }

  public setupInteractivity(): void {
    this.spruceTreeSprite.addEventListener("mouseover", () => {
      // Only show selection if not in ghost mode
      if (this.getTrait('ghostable').ghostMode) return;

      this.selectionSprite.renderable = true;
      this.selectionSprite.interactive = false;
      this.selectionSprite.eventMode = "none";

      // Get spruce tree infographic from the registry, passing this entity instance
      const spruceTreeInfographic = infographicsRegistry.get("spruce-tree", this);

      if (spruceTreeInfographic) {
        infographicStore.setState(() => ({
          active: true,
          component: spruceTreeInfographic.component,
          item: spruceTreeInfographic.creatorFunction ? {
            name: spruceTreeInfographic.name,
            node: spruceTreeInfographic.name,
            creatorFunction: spruceTreeInfographic.creatorFunction
          } : undefined
        }));
      }
    });

    this.getTrait("container").container.addEventListener("mouseout", () => {
      this.selectionSprite.renderable = false;

      infographicStore.setState(() => ({ active: false }));
    });

    // this.spruceTreeSprite.addEventListener("mouseout", () => {
    //   this.selectionSprite.renderable = false;

    //   infographicStore.setState(() => ({ active: false }));
    // });
  }

  public destroy(): void {
    // Clean up traits
    this.getTrait('container').container.removeChild(this.spruceTreeSprite);
    this.getTrait('container').container.removeChild(this.selectionSprite);
    
    // Remove all event listeners
    this.spruceTreeSprite.removeAllListeners();
  }
}