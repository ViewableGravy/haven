import { Position, type NonNullablePosition, type PositionType } from ".";
import { EventEmitter, type Unsubscribe } from "../eventEmitter";

export class SubscribablePosition extends EventEmitter<Position> implements Position {
  private _position: NonNullablePosition;

  constructor(
    _x: number,
    _y: number,
    _type: PositionType = "global"
  ) {
    super();
    this._position = new Position(_x, _y, _type) satisfies NonNullablePosition;
  }

  public subscribeImmediately = (callback: (position: Position) => void): Unsubscribe => {
    callback(this._position);
    return this.subscribe(callback);
  }

  public set x(x: number) {
    this._position.x = x;
    this.emit(this._position);
  }
  public set y(y: number) {
    this._position.y = y;
    this.emit(this._position);
  }
  public set type(type: PositionType) {
    this._position.type = type;
    this.emit(this._position);
  }
  public set position({ x, y, type }: Partial<Position>) {
    this._position.x = x ?? this._position.x;
    this._position.y = y ?? this._position.y;
    this._position.type = type ?? this._position.type;
    this.emit(this._position);
  }

  public get x() { return this._position.x; }
  public get y() { return this._position.y; }
  public get type() { return this._position.type as PositionType; }
  public get position() { return this._position; }
}

