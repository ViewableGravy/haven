/***** TYPE DEFINITIONS *****/
import { Sprite, Texture } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { SpruceTreeSprite } from "../../spriteSheets/spruceTree";
import type { Game } from "../../utilities/game/game";
import { infographicsRegistry } from "../../utilities/infographics";
import { entitySyncRegistry } from "../../utilities/multiplayer/entitySyncRegistry";
import type { Position } from "../../utilities/position";
import { TransformTrait } from "../../utilities/transform";
import { BaseEntity } from "../base";
import { ContainerTrait } from "../traits/container";
import { GhostableTrait } from "../traits/ghostable";
import { PlaceableTrait } from "../traits/placeable";
import { createSpruceTreeInfographicNode } from "./info";

/***** BASE SPRUCE TREE *****/
export class BaseSpruceTree extends BaseEntity {
  public transformTrait: TransformTrait;
  public spruceTreeSprite: Sprite;
  public selectionSprite: Sprite;
  public containerTrait: ContainerTrait;
  public ghostableTrait: GhostableTrait;
  public placeableTrait: PlaceableTrait;

  constructor(game: Game, position: Position) {
    super({ name: "spruce-tree" });

    this.transformTrait = TransformTrait.createSmall(game, position.x, position.y, position.type);
    this.spruceTreeSprite = BaseSpruceTree.createSpruceTreeSprite(this.transformTrait);
    this.selectionSprite = BaseSpruceTree.createSelectionSprite();

    // Initialize traits
    this.containerTrait = new ContainerTrait(this, this.transformTrait);
    this.ghostableTrait = new GhostableTrait(this, false);
    this.placeableTrait = new PlaceableTrait(this, false, () => {
      this.ghostableTrait.ghostMode = false;
    });
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
    sprite.width = 96;
    sprite.height = 128;
    sprite.x = -16;
    sprite.y = -96; // Offset up by 2 tiles since tree is 3 tiles tall
    sprite.renderable = false;
    // Set z-index higher than the tree sprite to ensure it's always on top
    sprite.zIndex = 100;
    return sprite;
  }

  public setupInteractivity(): void {
    this.spruceTreeSprite.addEventListener("mouseover", () => {
      // Only show selection if not in ghost mode
      if (this.ghostableTrait.ghostMode) return;

      this.selectionSprite.renderable = true;

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

    this.spruceTreeSprite.addEventListener("mouseout", () => {
      this.selectionSprite.renderable = false;

      infographicStore.setState(() => ({ active: false }));
    });
  }
}

/***** FACTORY FUNCTION *****/
export type SpruceTree = BaseSpruceTree;

export function createStandardSpruceTree(game: Game, position: Position): SpruceTree {
  const spruceTree = new BaseSpruceTree(game, position);

  // Add sprites to container
  spruceTree.containerTrait.container.addChild(spruceTree.spruceTreeSprite);
  spruceTree.containerTrait.container.addChild(spruceTree.selectionSprite);

  // Ensure proper z-index sorting
  spruceTree.containerTrait.container.sortableChildren = true;

  // Setup interactivity
  spruceTree.setupInteractivity();

  return spruceTree;
}

/***** INFOGRAPHIC REGISTRATION *****/
// Register the spruce tree infographic when this module loads
infographicsRegistry.register("spruce-tree", (entity: SpruceTree) => ({
  name: "Spruce Tree",
  component: createSpruceTreeInfographicNode(entity),
  creatorFunction: createStandardSpruceTree
}));

/***** ENTITY SYNC REGISTRATION *****/
// Register the spruce tree entity sync creator
entitySyncRegistry.register("spruce-tree", {
  name: "Spruce Tree",
  creatorFunction: createStandardSpruceTree
});
