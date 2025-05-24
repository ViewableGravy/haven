import { Container, Sprite, Texture, type ContainerChild } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import { SubscribablePosition } from "../../utilities/position/subscribable";
import type { Position as RawPosition } from "../../utilities/position/types";
import { store } from "../../utilities/store";
import { BaseEntity } from "../base";
import type { HasContainer, HasPosition } from "../interfaces";
import { createTestEntityInfographicNode } from "./info";





export class Assembler extends BaseEntity implements HasContainer, HasPosition {
  public container: ContainerChild;
  public position: SubscribablePosition;

  public _assembler: Sprite;
  private _ghostMode: boolean = false;

  constructor(position: RawPosition) { 
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
    container.width = store.consts.tileSize * 2;
    container.height = store.consts.tileSize * 2;
    
    position.subscribeImmediately(({ x, y }) => {
      container.x = x;
      container.y = y;
    });

    return container;
  }

  private static createSelectionSprite = () => {
    const selectionSprite = new Sprite(Texture.from(Selection))
    selectionSprite.width = store.consts.tileSize * 2;
    selectionSprite.height = store.consts.tileSize * 2;
    selectionSprite.x = 0;
    selectionSprite.y = 0;
    selectionSprite.renderable = false;

    return selectionSprite;
  }

  private static createAssemblerSprite = () => {
    const assembler = AssemblerSprite.createSprite("assembling-machine-1");
    assembler.interactive = true;
    assembler.width = store.consts.tileSize * 2;
    assembler.height = store.consts.tileSize * 2;
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