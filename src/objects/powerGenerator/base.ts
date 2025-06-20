/***** IMPORTS *****/
import { GameObject } from "../base";
import { ContainerTrait } from "../traits/container";
import { GhostableTrait } from "../traits/ghostable";
import { PlaceableTrait } from "../traits/placeable";
import { PoweredTrait } from "../traits/powered";
import { TransformTrait } from "../traits/transform";
import type { Game } from "../../utilities/game/game";
import type { Position } from "../../utilities/position";
import { Graphics } from "pixi.js";

/***** POWER GENERATOR ENTITY *****/
export class PowerGenerator extends GameObject {
  private graphics: Graphics = new Graphics();

  constructor(game: Game, position: Position) {
    super({ name: "power-generator" });

    // Add transform trait
    const transformTrait = TransformTrait.createSmall(game, position.x, position.y, position.type);
    this.addTrait('position', transformTrait);

    // Add container trait
    this.addTrait('container', new ContainerTrait(this, transformTrait));

    // Add placeable trait
    this.addTrait('placeable', new PlaceableTrait(this, false, () => {
      this.getTrait('ghostable').ghostMode = false;
    }));

    // Add ghostable trait
    this.addTrait('ghostable', new GhostableTrait(this, false));    // Add powered trait - generator is a producer that provides power
    this.addTrait('powered', new PoweredTrait(this, game, {
      isConsumer: false,
      isProducer: true,
      isRelay: false,
      isBattery: false,
      powerType: "mechanical",
      minimumPower: 0,
      maximumPower: 10,
      consumptionRate: 0
    }));

    this.createSprite();
  }

  /***** SPRITE CREATION *****/
  private createSprite(): void {
    // Create a simple visual representation of a generator
    this.graphics.clear();
    
    // Base generator body
    this.graphics.rect(-24, -24, 48, 48);
    this.graphics.fill(0x666666); // Gray color
    
    // Generator details
    this.graphics.circle(0, 0, 16);
    this.graphics.fill(0x333333); // Dark gray center
    
    // Power indicator
    this.graphics.circle(0, 0, 8);
    this.graphics.fill(0x00FF00); // Green center to indicate power

    // Center the graphics
    this.graphics.pivot.set(0, 0);
  }

  /***** GETTERS *****/
  public get generatorGraphics(): Graphics {
    return this.graphics;
  }
}
