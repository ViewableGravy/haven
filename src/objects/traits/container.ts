/***** TYPE DEFINITIONS *****/
import { Container } from "pixi.js";
import type { GameObject } from "../base";
import type { TransformTrait } from "./transform";

/***** CONTAINER TRAIT *****/
export class ContainerTrait {
  public container: Container;
  private positionUnsubscribe?: () => void;

  constructor(_entity: GameObject, transform?: TransformTrait) {
    this.container = new Container();

    if (transform) {
      this.container.width = transform.size.width;
      this.container.height = transform.size.height;

      this.positionUnsubscribe = transform.position.subscribeImmediately(({ x, y }) => {
        this.container.x = x;
        this.container.y = y;
      });
    }
  }

  /***** CLEANUP *****/
  public destroy(): void {
    // Unsubscribe from position changes
    if (this.positionUnsubscribe) {
      this.positionUnsubscribe();
      this.positionUnsubscribe = undefined;
    }
    
    // Destroy the PIXI container
    this.container.destroy({ children: true });
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): entity is GameObject {
    try {
      entity.getTrait('container');
      return true;
    } catch {
      return false;
    }
  }
}