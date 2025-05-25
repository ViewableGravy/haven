/***** TYPE DEFINITIONS *****/
import { Container } from "pixi.js";
import type { Transform } from "../../utilities/transform";
import type { BaseEntity } from "../base";

/***** CONTAINER TRAIT *****/
export class ContainerTrait {
  public container: Container;

  constructor(_entity: BaseEntity, transform?: Transform) {
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
}