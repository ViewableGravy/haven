/***** TYPE DEFINITIONS *****/
import { Container } from "pixi.js";
import type { TransformTrait } from "../../utilities/transform";
import type { BaseEntity } from "../base";

export interface HasContainerTrait {
  containerTrait: ContainerTrait;
}

/***** CONTAINER TRAIT *****/
export class ContainerTrait {
  public container: Container;

  constructor(_entity: BaseEntity, transform?: TransformTrait) {
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
  static is(entity: BaseEntity): entity is BaseEntity & HasContainerTrait {
    return 'containerTrait' in entity && entity.containerTrait instanceof ContainerTrait;
  }
}