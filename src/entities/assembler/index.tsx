import { Container, Sprite, Texture, type ContainerChild } from "pixi.js";
import Selection from "../../assets/selection.png";
import { infographicStore } from "../../components/infographic/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import type { Game } from "../../utilities/game/game";
import type { Position } from "../../utilities/position";
import { Rectangle } from "../../utilities/rectangle";
import { Transform } from "../../utilities/transform";
import { BaseEntity } from "../base";
import type { HasContainer, HasTransform } from "../interfaces";
import { createTestEntityInfographicNode } from "./info";

export class Assembler extends BaseEntity implements HasContainer, HasTransform {
  public container: ContainerChild;
  public transform: Transform;

  public _assembler: Sprite;
  private _ghostMode: boolean = false;

  constructor(
    game: Game,
    position: Position
  ) { 
    // Create transform using the new system (2x2 tiles for assembler)
    const transform = Transform.createMedium(game, position.x, position.y, position.type);
    
    // Create basic components for the entity
    const container = Assembler.createContainer(transform);
    const selectionSprite = Assembler.createSelectionSprite(transform);
    const assembler = Assembler.createAssemblerSprite(transform);

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
    this.transform = transform;
    this.container = container;
    this._assembler = assembler;
  }

  private static createContainer = (transform: Transform): Container => {
    const container = new Container();
    container.width = transform.size.width;
    container.height = transform.size.height;
    
    transform.position.subscribeImmediately(({ x, y }) => {
      container.x = x;
      container.y = y;
    });

    return container;
  }

  private static createSelectionSprite = (transform: Transform) => {
    const selectionSprite = new Sprite(Texture.from(Selection))
    selectionSprite.width = transform.size.width;
    selectionSprite.height = transform.size.height;
    selectionSprite.x = 0;
    selectionSprite.y = 0;
    selectionSprite.renderable = false;

    return selectionSprite;
  }

  private static createAssemblerSprite = (transform: Transform) => {
    const assembler = AssemblerSprite.createSprite("assembling-machine-1");
    assembler.interactive = true;
    assembler.width = transform.size.width;
    assembler.height = transform.size.height;
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

  // Convenience methods that delegate to transform
  public get position() { return this.transform.position; }
  public get size() { return this.transform.size; }
  public get rectangle() { return this.transform.rectangle; }

  // Check if this assembler intersects with another entity
  public intersects(other: { transform?: Transform; rectangle?: Rectangle }): boolean {
    if (other.transform) {
      return this.transform.intersects(other.transform);
    }
    // Fallback for entities without transform
    return this.transform.rectangle && other.rectangle ? 
      Rectangle.intersects(this.transform.rectangle, other.rectangle) : false;
  }
}