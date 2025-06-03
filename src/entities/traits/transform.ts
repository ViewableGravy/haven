import type { Game } from "../../utilities/game/game";
import type { PositionType } from "../../utilities/position";
import { SubscribablePosition } from "../../utilities/position/subscribable";
import { Rectangle } from "../../utilities/rectangle";
import { Size } from "../../utilities/size";
import type { BaseEntity } from "../base";

export interface HasTransformTrait {
  transformTrait: TransformTrait;
}

/**
 * Transform combines position, size, and rectangle into a single cohesive system
 * This simplifies entity creation and management
 */
export class TransformTrait {
  public position: SubscribablePosition;
  public size: Size;
  public rectangle: Rectangle;

  constructor(
    game: Game,
    x: number,
    y: number,
    width?: number,
    height?: number,
    positionType: "global" | "screenspace" | "local" = "global"
  ) {
    // Use game constants for default sizing
    const defaultSize = game.consts.tileSize;
    
    this.position = new SubscribablePosition(x, y, positionType);
    this.size = new Size(width ?? defaultSize, height ?? defaultSize);
    this.rectangle = new Rectangle(this.position, this.size);
  }

  // Factory methods for common entity sizes
  static createSmall(game: Game, x: number, y: number, positionType?: PositionType): TransformTrait {
    return new TransformTrait(game, x, y, game.consts.tileSize, game.consts.tileSize, positionType);
  }
 
  static createMedium(game: Game, x: number, y: number, positionType?: PositionType): TransformTrait {
    return new TransformTrait(game, x, y, game.consts.tileSize * 2, game.consts.tileSize * 2, positionType);
  }

  static createLarge(game: Game, x: number, y: number, positionType?: PositionType): TransformTrait {
    return new TransformTrait(game, x, y, game.consts.tileSize * 3, game.consts.tileSize * 3, positionType);
  }

  static createCustom(game: Game, x: number, y: number, width: number, height: number, positionType?: PositionType): TransformTrait {
    return new TransformTrait(game, x, y, width, height, positionType);
  }

  // Helper methods
  public setPosition(x: number, y: number): void {
    this.position.position = { x, y };
  }

  public setSize(width: number, height: number): void {
    this.size.size = { width, height };
  }

  public intersects(other: TransformTrait): boolean {
    return Rectangle.intersects(this.rectangle, other.rectangle);
  }

  public contains(other: TransformTrait): boolean {
    return Rectangle.contains(this.rectangle, other.rectangle);
  }

  public static is(entity: BaseEntity): entity is BaseEntity & HasTransformTrait {
    return 'transformTrait' in entity && entity.transformTrait instanceof TransformTrait;
  }
}