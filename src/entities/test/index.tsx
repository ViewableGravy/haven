import { Container, Sprite, Texture, type ContainerChild } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Position } from "../../utilities/position/types";
import { store } from "../../utilities/store";
import { Entity } from "../entity";
import { createTestEntityInfographicNode } from "./info";

export class TestEntity extends Entity {
  public containerChild: ContainerChild;
  public _assembler: Sprite;

  private _ghostMode: boolean = false;

  constructor(
    public position: Position
  ) { 
    super();
    const { assembler, container } = this.create();

    this.containerChild = container;
    this._assembler = assembler;
  }

  private create = () => {
    const container = this.createContainer();
    const selectionSprite = this.createSelectionSprite();
    const assembler = this.createAssemblerSprite();

    assembler.addEventListener("mouseover", () => {
      if (this.ghostMode) return;

      // push hover state globally
      Entity.hoveredMap[assembler.uid] = true;

      // Update graphic
      container.addChild(selectionSprite);

      // Render infographic
      infographicStore.setState(() => ({
        active: true,
        component: createTestEntityInfographicNode(this)
      }));
    })

    assembler.addEventListener("mouseout", () => {
      delete Entity.hoveredMap[assembler.uid];

      // Update graphic
      container.removeChild(selectionSprite);

      infographicStore.setState(() => ({
        active: false,
      }));
    })

    container.addChild(assembler);

    return { container, assembler }
  }

  private createContainer = (): Container => {
    const container = new Container();
    container.width = store.consts.tileSize * 2;
    container.height = store.consts.tileSize * 2;
    container.x = this.position.x;
    container.y = this.position.y;

    return container;
  }

  private createSelectionSprite = () => {
    const selectionSprite = new Sprite(Texture.from(Selection))
    selectionSprite.width = store.consts.tileSize * 2;
    selectionSprite.height = store.consts.tileSize * 2;
    selectionSprite.x = 0;
    selectionSprite.y = 0;

    return selectionSprite;
  }

  private createAssemblerSprite = () => {
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
      this.containerChild.alpha = 0.7;
    } else {
      this.containerChild.alpha = 1;
    }
  }
  public get ghostMode() {
    return this._ghostMode;
  }
}