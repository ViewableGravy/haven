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

/***** CONVEYOR BELT ENTITY *****/
export class ConveyorBelt extends GameObject {
  private graphics: Graphics = new Graphics();
  private game: Game;
  private powerStateCallback: (isPowered: boolean) => void;

  constructor(game: Game, position: Position) {
    super({ name: "conveyor-belt" });
    this.game = game;
    
    // Bind the power state callback
    this.powerStateCallback = this.onPowerStateChanged.bind(this);

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
    this.addTrait('ghostable', new GhostableTrait(this, false));    // Add powered trait - conveyor is a consumer that requires power to operate
    this.addTrait('powered', new PoweredTrait(this, game, {
      isConsumer: true,
      isProducer: false,
      isRelay: false,
      isBattery: false,
      powerType: "mechanical",
      minimumPower: 1,
      maximumPower: 5,
      consumptionRate: 2
    }));

    this.createSprite();
    this.setupPowerListener();
  }

  /***** SPRITE CREATION *****/
  private createSprite(): void {
    // Create a simple visual representation
    this.graphics.clear();
    
    // Base conveyor rectangle
    this.graphics.rect(-32, -16, 64, 32);
    this.graphics.fill(0x8B4513); // Brown color
    
    // Conveyor belt strips
    this.graphics.rect(-28, -12, 56, 8);
    this.graphics.fill(0x2F2F2F); // Dark gray
    
    this.graphics.rect(-28, 4, 56, 8);
    this.graphics.fill(0x2F2F2F); // Dark gray

    // Center the graphics
    this.graphics.pivot.set(0, 0);
  }

  /***** POWER STATE HANDLING *****/
  public onPowerStateChanged(isPowered: boolean): void {
    // Change visual appearance based on power state
    if (isPowered) {
      this.graphics.tint = 0xFFFFFF; // Normal color
      this.startConveyorAnimation();
    } else {
      this.graphics.tint = 0x808080; // Grayed out when unpowered
      this.stopConveyorAnimation();
    }
  }

  private startConveyorAnimation(): void {
    // In a real implementation, this would animate the conveyor belt
    console.log(`Conveyor ${this.uid} started moving`);
  }

  private stopConveyorAnimation(): void {
    // Stop conveyor animation
    console.log(`Conveyor ${this.uid} stopped moving`);
  }  /***** POWER SYSTEM INTEGRATION *****/
  private setupPowerListener(): void {
    // Register for power state change events from the power manager
    this.game.powerManager.onEntityPowerStateChange(this.uid, this.powerStateCallback);
  }
  /***** CLEANUP *****/
  public destroy(notifyServer: boolean = false): void {
    // Unregister power state change callback
    this.game.powerManager.offEntityPowerStateChange(this.uid, this.powerStateCallback);
    
    // Call parent cleanup
    super.destroy(notifyServer);
  }

  /***** GETTERS *****/
  public get conveyorGraphics(): Graphics {
    return this.graphics;
  }
}
