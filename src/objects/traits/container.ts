/***** TYPE DEFINITIONS *****/
import { Container } from "pixi.js";
import type { GameObject } from "../base";
import type { TransformTrait } from "./transform";

export interface HasContainerTrait {
  containerTrait: ContainerTrait;
}

/***** CONTAINER TRAIT *****/
export class ContainerTrait {
  public container: Container;

  constructor(_entity: GameObject, transform?: TransformTrait) {
    this.container = new Container();

    if (transform) {
      this.container.width = transform.size.width;
      this.container.height = transform.size.height;

      transform.position.subscribeImmediately(({ x, y }) => {
        this.container.x = x;
        this.container.y = y;
      });
    }
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): entity is GameObject & HasContainerTrait {
    return 'containerTrait' in entity && entity.containerTrait instanceof ContainerTrait;
  }
}