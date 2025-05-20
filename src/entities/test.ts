import { Container, Sprite, Texture, type ContainerChild } from "pixi.js";
import Selection from "../assets/selection.png";
import { AssemblerSprite } from "../spriteSheets/assembler";
import type { Position } from "../utilities/position/types";
import { store } from "../utilities/store";
import { Entity } from "./entity";

export class TestEntity extends Entity {
  public child: ContainerChild;

  constructor(
    public position: Position
  ) { 
    super();
    this.child = this.createGraphic();
  }

  private createGraphic = (): ContainerChild => {
    const container = new Container();
    container.width = store.consts.tileSize * 2;
    container.height = store.consts.tileSize * 2;
    container.x = this.position.x;
    container.y = this.position.y;

    // const graphic = new Graphics()
    const assembler = AssemblerSprite.createSprite("assembling-machine-1");
    assembler.interactive = true;
    assembler.width = store.consts.tileSize * 2;
    assembler.height = store.consts.tileSize * 2;
    assembler.x = 0;
    assembler.y = 0;

    const selectionSprite = new Sprite(Texture.from(Selection))
    selectionSprite.width = store.consts.tileSize * 2;
    selectionSprite.height = store.consts.tileSize * 2;
    selectionSprite.x = 0;
    selectionSprite.y = 0;

    container.addChild(assembler);

    assembler.onmouseover = () => {
      // push hover state globally
      Entity.hoveredMap[assembler.uid] = true;

      // Update graphic
      container.addChild(selectionSprite);
    }

    assembler.onmouseout = () => {
      delete Entity.hoveredMap[assembler.uid];

      // Update graphic
      container.removeChild(selectionSprite);
    }

    return container;
  }
}