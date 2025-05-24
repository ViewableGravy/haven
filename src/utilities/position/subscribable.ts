import { EventEmitter, type Unsubscribe } from "../eventEmitter";
import type { Position, PositionType } from "./types";

export class SubscribablePosition extends EventEmitter<Position> {
  constructor(
    private _x: number,
    private _y: number,
    private _type: PositionType = "global"
  ) {
    super();
  }

  public subscribeImmediately = (callback: (position: Position) => void): Unsubscribe => {
    callback({ x: this._x, y: this._y, type: this._type });
    return this.subscribe(callback);
  }

  public set x(x: number) {
    this._x = x;
    this.emit({ x, y: this._y, type: this._type });
  }
  public set y(y: number) {
    this._y = y;
    this.emit({ x: this._x, y, type: this._type });
  }
  public set type(type: PositionType) {
    this._type = type;
    this.emit({ x: this._x, y: this._y, type });
  }
  public set position({ x, y, type }: Partial<Position>) {
    this._x = x ?? this._x;
    this._y = y ?? this._y;
    this._type = type ?? this._type;
    this.emit({ x: this._x, y: this._y, type: this._type });
  }
  
  public get x() { return this._x; }
  public get y() { return this._y; }
  public get type() { return this._type; }
  public get position() { return { x: this._x, y: this._y }; }
}

