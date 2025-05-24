import { Container, Sprite, Texture, type ContainerChild } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Position } from "../../utilities/position";
import { SubscribablePosition } from "../../utilities/position/subscribable";
import { Rectangle } from "../../utilities/rectangle";
import { Size } from "../../utilities/size";
import { store } from "../../utilities/store";
import { BaseEntity } from "../base";
import type { HasContainer, HasPosition, hasSize } from "../interfaces";
import { createTestEntityInfographicNode } from "./info";

export class Assembler extends BaseEntity implements HasContainer, HasPosition, hasSize, Rectangle {
  public container: ContainerChild;
  public position: SubscribablePosition;
  public size: Size = Assembler.size;

  public _assembler: Sprite;
  private _ghostMode: boolean = false;
  private static get size(): Size {
    return new Size(store.consts.tileSize * 2, store.consts.tileSize * 2);
  };

  constructor(
    position: Position
  ) { 
    // Create basic components for the entity
    const subscribablePosition = new SubscribablePosition(position.x, position.y);
    const container = Assembler.createContainer(subscribablePosition);
    const selectionSprite = Assembler.createSelectionSprite();
    const assembler = Assembler.createAssemblerSprite();

    // Add the selection sprite to the container
    container.addChild(assembler);
    container.addChild(selectionSprite);

    // Apply event listeners to the assembler
    assembler.addEventListener("mouseover", () => {
      if (this.ghostMode) return;

      // Update graphic
      selectionSprite.renderable = true;

      // Render infographic
      infographicStore.setState(() => ({
        active: true,
        component: createTestEntityInfographicNode(this)
      }));
    })

    assembler.addEventListener("mouseout", () => {
      // Update graphic
      selectionSprite.renderable = false;

      // Remove infographic
      infographicStore.setState(() => ({
        active: false,
      }));
    })
    
    // Setup the Entity based on the container id
    super(container.uid)

    // Setup local variables
    this.position = subscribablePosition;
    this.container = container;
    this._assembler = assembler;
  }

  private static createContainer = (position: SubscribablePosition): Container => {
    const container = new Container();
    container.width = Assembler.size.width;
    container.height = Assembler.size.height;
    
    position.subscribeImmediately(({ x, y }) => {
      container.x = x;
      container.y = y;
    });

    return container;
  }

  private static createSelectionSprite = () => {
    const selectionSprite = new Sprite(Texture.from(Selection))
    selectionSprite.width = Assembler.size.width;
    selectionSprite.height = Assembler.size.height;
    selectionSprite.x = 0;
    selectionSprite.y = 0;
    selectionSprite.renderable = false;

    return selectionSprite;
  }

  private static createAssemblerSprite = () => {
    const assembler = AssemblerSprite.createSprite("assembling-machine-1");
    assembler.interactive = true;
    assembler.width = Assembler.size.width;
    assembler.height = Assembler.size.height;
    assembler.x = 0;
    assembler.y = 0;

    return assembler;
  }

  public set ghostMode(value: boolean) {
    this._ghostMode = value;
    if (value) {
      this.container.alpha = 0.7;
    } else {
      this.container.alpha = 1;
    }
  }
  public get ghostMode() {
    return this._ghostMode;
  }
}