import { EventEmitter, type Unsubscribe } from "../eventEmitter";
import type { Position as RawPosition } from "./types";



export class Position extends EventEmitter<RawPosition> {
  constructor(
    private _x: number,
    private _y: number
  ) {
    super();
  }

  public subscribeImmediately = (callback: (position: RawPosition) => void): Unsubscribe => {
    callback({ x: this._x, y: this._y });
    return this.subscribe(callback);
  }

  public set x(x: number) {
    this._x = x;
    this.emit({ x, y: this._y });
  }
  public set y(y: number) {
    this._y = y;
    this.emit({ x: this._x, y });
  }
  public set position({ x, y }: RawPosition) {
    this._x = x;
    this._y = y;
    this.emit({ x, y });
  }
  
  public get x() { return this._x; }
  public get y() { return this._y; }
  public get position() { return { x: this._x, y: this._y }; }
}

