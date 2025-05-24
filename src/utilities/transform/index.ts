import type { Game } from "../game/game";
import { SubscribablePosition } from "../position/subscribable";
import { Rectangle } from "../rectangle";
import { Size } from "../size";

/**
 * Transform combines position, size, and rectangle into a single cohesive system
 * This simplifies entity creation and management
 */
export class Transform {
  public position: SubscribablePosition;
  public size: Size;
  public rectangle: Rectangle;

  constructor(
    game: Game,
    x: number,
    y: number,
    width?: number,
    height?: number,
    positionType: "global" | "local" | "screenspace" = "global"
  ) {
    // Use game constants for default sizing
    const defaultSize = game.consts.tileSize;
    
    this.position = new SubscribablePosition(x, y, positionType);
    this.size = new Size(width ?? defaultSize, height ?? defaultSize);
    this.rectangle = new Rectangle(this.position, this.size);

    // Update rectangle when position changes
    this.position.subscribe((newPosition) => {
      this.rectangle.position = newPosition;
    });
  }

  // Factory methods for common entity sizes
  static createSmall(game: Game, x: number, y: number, positionType?: "global" | "local" | "screenspace"): Transform {
    return new Transform(game, x, y, game.consts.tileSize, game.consts.tileSize, positionType);
  }

  static createMedium(game: Game, x: number, y: number, positionType?: "global" | "local" | "screenspace"): Transform {
    return new Transform(game, x, y, game.consts.tileSize * 2, game.consts.tileSize * 2, positionType);
  }

  static createLarge(game: Game, x: number, y: number, positionType?: "global" | "local" | "screenspace"): Transform {
    return new Transform(game, x, y, game.consts.tileSize * 3, game.consts.tileSize * 3, positionType);
  }

  static createCustom(game: Game, x: number, y: number, width: number, height: number, positionType?: "global" | "local" | "screenspace"): Transform {
    return new Transform(game, x, y, width, height, positionType);
  }

  // Helper methods
  public setPosition(x: number, y: number): void {
    this.position.position = { x, y };
  }

  public setSize(width: number, height: number): void {
    this.size.size = { width, height };
  }

  public intersects(other: Transform): boolean {
    return Rectangle.intersects(this.rectangle, other.rectangle);
  }

  public contains(other: Transform): boolean {
    return Rectangle.contains(this.rectangle, other.rectangle);
  }
}