/***** TYPE DEFINITIONS *****/
import { Container, type ContainerChild } from "pixi.js";
import type { Transform } from "../../../utilities/transform";
import type { BaseEntity } from "../../base";
import { EntityBuilder } from "../../builder";

export interface ContainerTrait {
  container: ContainerChild;
}

export type ContainerOptions = {
  transform?: Transform;
  width?: number;
  height?: number;
};

/***** CONTAINER TRAIT *****/
export const ContainerProvider = EntityBuilder.createTrait<ContainerOptions, ContainerTrait>((entity, options = {}) => {
  const container = new Container();
  
  // Set dimensions if provided
  if (options.width) container.width = options.width;
  if (options.height) container.height = options.height;
  
  // Subscribe to transform if provided
  if (options.transform) {
    container.width = options.transform.size.width;
    container.height = options.transform.size.height;
    
    options.transform.position.subscribeImmediately(({ x, y }) => {
      container.x = x;
      container.y = y;
    });
  }

  // Add container property
  Object.defineProperty(entity, 'container', {
    value: container,
    writable: false,
    enumerable: true,
    configurable: false
  });

  return entity as BaseEntity & ContainerTrait;
});