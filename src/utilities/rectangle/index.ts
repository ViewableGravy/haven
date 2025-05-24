import { hasPosition, hasRectangle, hasSize } from "../../entities/interfaces";
import type { Position } from "../position";
import type { Size } from "../size";

type ObjectWithRectangle = { rectangle: Rectangle };

export class Rectangle {
  constructor(
    public position: Position,
    public size: Size
  ) {}

  public static intersects(self: ObjectWithRectangle | Rectangle, other : ObjectWithRectangle | Rectangle): boolean {
    const selfSize = self instanceof Rectangle ? self.size : self.rectangle.size;
    const selfPosition = self instanceof Rectangle ? self.position : self.rectangle.position;
    const otherSize = other instanceof Rectangle ? other.size : other.rectangle.size;
    const otherPosition = other instanceof Rectangle ? other.position : other.rectangle.position;

    return (
      selfPosition.x < otherPosition.x + otherSize.width &&
      selfPosition.x + selfSize.width > otherPosition.x &&
      selfPosition.y < otherPosition.y + otherSize.height &&
      selfPosition.y + selfSize.height > otherPosition.y
    )
  }

  public static canIntersect(entity: unknown): entity is ObjectWithRectangle | Rectangle {
    return (
      hasRectangle(entity) || 
      (hasSize(entity) && hasPosition(entity))
    )
  }

  public static contains(self: Rectangle, other: Rectangle): boolean {
    return (
      self.position.x <= other.position.x &&
      self.position.x + self.size.width >= other.position.x + other.size.width &&
      self.position.y <= other.position.y &&
      self.position.y + self.size.height >= other.position.y + other.size.height
    );
  }
}